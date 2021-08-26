package com.sap.iot.edgeservices.customhttpserver.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

@Service
public class FileSystemStorageService implements StorageService {

    private final Path rootLocation;

    private static final Logger LOGGER = LoggerFactory.getLogger(FileSystemStorageService.class);

    @Autowired
    public FileSystemStorageService(StorageProperties properties) {
        this.rootLocation = Paths.get(properties.getLocation());
    }

    @Override
    public void store(MultipartFile file, String relativePath) {
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file.");
            }
            Path destinationFile = this.rootLocation.resolve(
                    Paths.get(relativePath + File.separator + file.getOriginalFilename()))
                    .normalize().toAbsolutePath();
            if (!destinationFile.getParent().startsWith(this.rootLocation.toAbsolutePath())) {
                // This is a security check
                throw new StorageException(
                        "Cannot store file outside current directory.");
            }
            File destination = destinationFile.toFile();
            destination.mkdirs();
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile,
                        StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new StorageException("Failed to store file.", e);
        }
    }

    @Override
    public Stream<Path> loadAll() {
        try {
            return Files.walk(this.rootLocation, 1)
                    .filter(path -> !path.equals(this.rootLocation))
                    .map(this.rootLocation::relativize);
        } catch (IOException e) {
            throw new StorageException("Failed to read stored files", e);
        }

    }

    @Override
    public Path load(String filename) {
        return rootLocation.resolve(filename);
    }

    @Override
    public Resource loadAsResource(String filename) {
        try {
            Path file = load(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new StorageFileNotFoundException(
                        "Could not read file: " + filename);

            }
        } catch (MalformedURLException e) {
            throw new StorageFileNotFoundException("Could not read file: " + filename, e);
        }
    }

    @Override
    public boolean deleteAll() {
        return FileSystemUtils.deleteRecursively(rootLocation.toFile());
    }

    @Override
    public int purge(Integer hoursToKeep) {
        if (hoursToKeep == null || hoursToKeep < 0) {
            LOGGER.info("Not valid retention period");
            return 0;
        }
        final Instant retentionFilePeriod = ZonedDateTime.now()
                .minusHours(hoursToKeep).toInstant();

        final AtomicInteger countDeletedFiles = new AtomicInteger();

        try (Stream<Path> files = Files.find(rootLocation.toAbsolutePath(), 1,
                (path, basicFileAttrs) -> basicFileAttrs.lastModifiedTime()
                        .toInstant().isBefore(retentionFilePeriod))) {
            files.forEach(fileToDelete -> {
                try {
                    if (!Files.isDirectory(fileToDelete)) {
                        Files.delete(fileToDelete);
                        countDeletedFiles.incrementAndGet();
                    }
                } catch (IOException e) {
                    throw new UncheckedIOException(e);
                }
            });
        } catch (Exception e) {
            LOGGER.error("Unable to purge completely folder due to {}", e.getMessage(), e);
        }

        return countDeletedFiles.get();
    }

    @Override
    public void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new StorageException("Could not initialize storage", e);
        }
    }
}