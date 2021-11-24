package apis

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
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

func PostAndReceiveBusCustomTopicMsg(response http.ResponseWriter, r *http.Request) {

	// extract the destination custom topic from the native API
	vars := mux.Vars(r)
	customTopic := vars["topic"]

	// parse the msg to be sent to the Bus
	defer r.Body.Close()
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Printf("Unexpected error while reading body: %s", err)
		response.WriteHeader(http.StatusInternalServerError)
		return
	}

	// subscribe to the Bus custom topic
	err = SubscribeToBusCustomTopic(customTopic)
	if err != nil {
		response.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(response, err)
		return
	}

	// send it to the Bus custom topic
	err = SendToBusCustomTopic(customTopic, string(body))
	if err != nil {
		response.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(response, err)
		return
	}

	// wait for a bit, to give time the message is properly received
	log.Printf("Give it a bit of time before checking the msg has been received ...")
	time.Sleep(2 * time.Second)

	// read the messages cached so far
	messages := ReadMessagesReceivedFromCustomTopic(customTopic)

	// fill the response with their json format
	fillResponseWithMessagesToJsonFormat(response, r, messages)
}
