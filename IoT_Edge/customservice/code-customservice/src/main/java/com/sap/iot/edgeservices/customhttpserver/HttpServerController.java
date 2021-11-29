package com.sap.iot.edgeservices.customhttpserver;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.sap.iot.edgeservices.customhttpserver.helper.MessageConverter;
import com.sap.iot.edgeservices.customhttpserver.helper.RestControllerHelper;
import com.sap.iot.edgeservices.customhttpserver.http.CustomResponseEntity;
import com.sap.iot.edgeservices.customhttpserver.http.RestClient;
import com.sap.iot.edgeservices.customhttpserver.storage.StorageFileNotFoundException;
import com.sap.iot.edgeservices.customhttpserver.storage.StorageService;
import com.sap.iot.edgeservices.customhttpserver.utils.Configuration;
import com.sap.iot.edgeservices.customhttpserver.utils.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.support.StandardMultipartHttpServletRequest;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@Controller
public class HttpServerController {

    private static final Logger LOG = LoggerFactory.getLogger(HttpServerController.class);

    private final StorageService storageService;

    @Autowired
    private RestControllerHelper apis;

    @Autowired
    private RestClient client;

    @Autowired
    private Configuration configuration;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private MessageConverter messageConverter;

    @Autowired
    public HttpServerController(StorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/")
    public String listUploadedFiles(Model model) {

        model.addAttribute("files", storageService.loadAll().map(
                path -> MvcUriComponentsBuilder.fromMethodName(HttpServerController.class,
                        "serveFile", path.getFileName().toString()).build().toUri().toString())
                .collect(Collectors.toList()));
        Map<String, Object> templateDescription = new HashMap<>();
        templateDescription.put("title", "Service usage");
        List<String> list = new ArrayList<>();
        list.add("Packets: " + configuration.getIngestionUrl() + "/measures/<deviceAlternateId>");
        list.add("Files: " + configuration.getIngestionUrl() + "/binaryData/<deviceAlternateId>");
        templateDescription.put("list", list);
        templateDescription.put("description", "Endpoints are pubblished at:");
        model.addAttribute("message", templateDescription);

        return "uploadForm";
    }

    @GetMapping("/files/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {

        Resource file = storageService.loadAsResource(filename);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + file.getFilename() + "\"").body(file);
    }

    @PostMapping("/binaryData/{deviceAlternateId}")
    public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file,
                                                   RedirectAttributes redirectAttributes, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, @PathVariable String deviceAlternateId) {
        long creationTime = ((StandardMultipartHttpServletRequest) httpServletRequest).getRequest().getSession().getCreationTime();
        long now = System.currentTimeMillis();
        //Create custom filename
        File fileModified = new File(file.getOriginalFilename());

        //file.transferTo(new File(file.getOriginalFilename()));
        String filename = StringUtils.cleanPath(file.getOriginalFilename());
        int extension = filename.lastIndexOf(".");
        if (extension < 0){
            extension = filename.length() -1;
        }
        //filename = new File("").getAbsolutePath() + "/" + filename.substring(0,extension) + "_" + deviceAlternateId + "_" + creationTime + "_" + now + filename.substring(extension);
        filename = new File("").getAbsolutePath() + "/" + filename.substring(0,extension) + "_" +
                deviceAlternateId.substring(0, 3) + "." + deviceAlternateId.substring(3, deviceAlternateId.length()) + "_"
                + creationTime + "_" + now + filename.substring(extension);
        try {
            file.transferTo(new File(filename));
        } catch (IOException e) {
            LOG.error("Unable to rename the file {} to {}", file.getOriginalFilename(), filename, e);
            return CustomResponseEntity.badReturn("CN102: CRITICAL ");
        }
        ResponseEntity<String> response = client.invokePost(new File(filename), deviceAlternateId);
        if(response.getStatusCode().is2xxSuccessful()){
            return CustomResponseEntity.created("CN100: OK ");
        }
        else{
            return CustomResponseEntity.badReturn("CN102: CRITICAL ");
        }
    }

    @PostMapping("/binaryDataStoreToDisk/{deviceAlternateId}")
    public String handleFileUploadDiskStorage(@RequestParam("file") MultipartFile file,
                                              RedirectAttributes redirectAttributes, @PathVariable String deviceAlternateId) {

        storageService.store(file, deviceAlternateId);
        redirectAttributes.addFlashAttribute("message",
                "You successfully uploaded " + file.getOriginalFilename() + "!");

        return "redirect:/";
    }

    @PostMapping("/measures/{deviceAlternateId}")
    public ResponseEntity<String> measures(@RequestBody String body, @RequestHeader MultiValueMap<String, String> headersR, @PathVariable(required = false) String deviceAlternateId) {
        String edgeUrl = Constants.EDGE_API_PROTOCOL.toString() + Constants.EDGE_HOSTNAME + configuration.getEdgeAPIPort();

        // convert message
        List<Map<String, Object>> messages = null;
        try {
            messages = messageConverter.convertMessage(body);
        } catch (JsonProcessingException e) {
            LOG.error("Json is invalid", e);
        }

        List<ResponseEntity<String>> responses = new ArrayList<>();
        assert messages != null;
        for (Map<String, Object> message : messages) {
            //get device
            String deviceAlternateIdComp = (String) message.get("deviceAlternateId");
            message.remove("deviceAlternateId");

            String url = edgeUrl + ":" + configuration.getEdgePort() + "/measures/" + deviceAlternateIdComp;

            String packet = null;
            try {
                packet = messageConverter.getMessage(message);
            } catch (JsonProcessingException e) {
                LOG.error("Packet bad formed for: {}", body, e);
            }
            // create headers
            HttpHeaders headers = new HttpHeaders();
            headers.addAll(headersR);
            // build the request
            HttpEntity<String> request = new HttpEntity<>(packet, headers);

            // use `exchange` method for HTTP call
            ResponseEntity<String> response = this.restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            responses.add(response);
        }
        if (responses.stream().anyMatch(responseEntity -> !responseEntity.getStatusCode().is2xxSuccessful())) {
            return CustomResponseEntity.badReturn("CN102: CRITICAL ");
        } else {
            return CustomResponseEntity.ok("CN100: OK ");
        }
    }


    @PostMapping("/clearstorage/{hours}")
    public ResponseEntity<?> clearStorage(@PathVariable(required = false) Integer hours) {
        int removedFiles = 0;
        ResponseEntity<?> resp;
        boolean isRemoved = false;
        if (hours == null || hours < 0) {
            isRemoved = storageService.deleteAll();
            resp = CustomResponseEntity.ok("Deleted all files result: " + isRemoved);

        } else {
            removedFiles = storageService.purge(hours);
            resp = CustomResponseEntity.ok("Deleted " + removedFiles + " files");
        }
        return resp;
    }

    @ExceptionHandler(StorageFileNotFoundException.class)
    public ResponseEntity<?> handleStorageFileNotFound(StorageFileNotFoundException exc) {
        return ResponseEntity.notFound().build();
    }

}