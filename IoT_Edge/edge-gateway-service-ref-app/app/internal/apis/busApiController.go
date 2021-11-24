package apis

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

func GetBusEgressTopicMeasures(response http.ResponseWriter, r *http.Request) {
	// read the messages cached so far
	messages := ReadMessagesReceivedFromBusEgressTopic()
	// fill the response with their json format
	fillResponseWithMessagesToJsonFormat(response, r, messages)
}

func fillResponseWithMessagesToJsonFormat(response http.ResponseWriter, r *http.Request, messages []string) {
	// covert messages to the expected json format
	jsonBody := "["
	if messages != nil {
		for i := 0; i < len(messages); i++ {
			jsonBody += messages[i]
			if i < len(messages)-1 {
				jsonBody += ","
			}
		}
	}
	jsonBody += "]"
	// fill the response
	response.WriteHeader(http.StatusOK)
	fmt.Fprint(response, jsonBody)
}

func PostBusIngressTopicMeasures(response http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	// parse the msg to be sent to the Bus
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Printf("Unexpected error while reading body: %s", err)
		response.WriteHeader(http.StatusInternalServerError)
		return
	}
	// send it to the Bus ingress topic
	err = SendToBusIngressTopic(string(body))
	if err != nil {
		log.Printf("Unexpected error: %s", err)
		response.WriteHeader(http.StatusInternalServerError)
		return
	}
	// fill the response
	response.WriteHeader(http.StatusAccepted)
	fmt.Fprint(response, "SUCCESS")
}
