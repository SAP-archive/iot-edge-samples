package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"app/internal/apis"
	"app/internal/config"

	"github.com/gorilla/mux"
	"github.com/heptiolabs/healthcheck"
)

var appConnectedAndSubscribedToBus bool

func main() {
	// -) Connect to the Mqtt Bus (through a separate task so that we do not block the app start up)
	go connectAndSubscribeToTheMqttBus()

	// -) Expose the application endPoints
	publishEndPoints()
}

func connectAndSubscribeToTheMqttBus() {
	for {
		err := apis.ConnectToBus()
		if err == nil {
			break
		} else {
			log.Printf("Not able to connect to the MQTT Bus (we'll retry in some seconds) due to: %s", err)
			time.Sleep(5000 * time.Millisecond)
			continue
		}
	}
	err := apis.SubscribeToBusEgressTopic()
	if err != nil {
		log.Printf("Unable to subscribe to the MQTT Bus egress topic due to: %s", err)
	} else {
		appConnectedAndSubscribedToBus = true
	}
}

func publishEndPoints() {
	router := mux.NewRouter()

	// Expose configuration endPoints
	router.HandleFunc("/config", config.UpdateConfig).Methods("PUT")
	router.HandleFunc("/config", config.GetConfig).Methods("GET")

	// Expose proxy endPoints for Edge Gateway Service REST endPoints
	router.HandleFunc("/gateways", apis.GetGateways).Methods("GET")
	router.HandleFunc("/gateways/{gatewayId}", apis.GetGatewayById).Methods("GET")
	router.HandleFunc("/devices", apis.GetDevices).Methods("GET")
	router.HandleFunc("/devices/{deviceId}", apis.GetDeviceById).Methods("GET")
	router.HandleFunc("/devices/commands", apis.PostDeviceCommands).Methods("POST")
	router.HandleFunc("/sensors", apis.GetSensors).Methods("GET")
	router.HandleFunc("/sensors/{sensorId}", apis.GetSensorById).Methods("GET")
	router.HandleFunc("/capabilities", apis.GetCapabilities).Methods("GET")
	router.HandleFunc("/capabilities/{capabilityId}", apis.GetCapabilityById).Methods("GET")
	router.HandleFunc("/sensorTypes", apis.GetSensorTypes).Methods("GET")
	router.HandleFunc("/sensorTypes/{sensorTypeId}", apis.GetSensorTypeById).Methods("GET")

	// Expose proxy endPoints for Edge Gateway Service MQTT Bus endPoints
	router.HandleFunc("/bus/measures", apis.GetBusEgressTopicMeasures).Methods("GET")
	router.HandleFunc("/bus/measures", apis.PostBusIngressTopicMeasures).Methods("POST")
	router.HandleFunc("/bus/customTopic/{topic}", apis.PostAndReceiveBusCustomTopicMsg).Methods("POST")

	// Expose an API to check Mqtt Bus connection/subscription status
	router.HandleFunc("/monitoring/busConnectionStatus", IsAppConnectedToBusAndSubscribedToEgressTopic).Methods("GET")

	// Add liveness/readiness APIs
	health := healthcheck.NewHandler()
	router.HandleFunc("/live", health.LiveEndpoint)
	router.HandleFunc("/ready", health.ReadyEndpoint)

	servicePort := "9000"
	if os.Getenv("SERVICE_PORT") != "" {
		// update the default service port
		servicePort = os.Getenv("SERVICE_PORT")
	}
	log.Printf("Starting service on port %s ...", servicePort)
	log.Fatal(http.ListenAndServe(":"+servicePort, router))
}

func IsAppConnectedToBusAndSubscribedToEgressTopic(response http.ResponseWriter, r *http.Request) {
	response.WriteHeader(http.StatusOK)
	fmt.Fprint(response, strconv.FormatBool(appConnectedAndSubscribedToBus))
}
