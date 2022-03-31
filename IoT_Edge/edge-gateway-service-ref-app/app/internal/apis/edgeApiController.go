package apis

import (
	"app/internal/config"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

////////////////////////////////////////////////////////////////////////

func GetGateways(response http.ResponseWriter, r *http.Request) {
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/gateways", None)
	fillResponse(response, r, originalResponse, err)
}

func GetGatewayById(response http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/gateways/"+vars["gatewayId"], None)
	fillResponse(response, r, originalResponse, err)
}

////////////////////////////////////////////////////////////////////////

func GetDevices(response http.ResponseWriter, r *http.Request) {
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/devices", None)
	fillResponse(response, r, originalResponse, err)
}

func GetDeviceById(response http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/devices/"+vars["deviceId"], None)
	fillResponse(response, r, originalResponse, err)
}

func PostDeviceCommands(response http.ResponseWriter, r *http.Request) {
	originalResponse, err := CallPostApi(config.Config.ApiRestPort, "/iot/edge/api/v1/devices/commands", r.Body, None)
	fillResponse(response, r, originalResponse, err)
}

////////////////////////////////////////////////////////////////////////

func GetSensors(response http.ResponseWriter, r *http.Request) {
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/sensors", None)
	fillResponse(response, r, originalResponse, err)
}

func GetSensorById(response http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/sensors/"+vars["sensorId"], None)
	fillResponse(response, r, originalResponse, err)
}

////////////////////////////////////////////////////////////////////////

func GetCapabilities(response http.ResponseWriter, r *http.Request) {
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/capabilities", None)
	fillResponse(response, r, originalResponse, err)
}

func GetCapabilityById(response http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/capabilities/"+vars["capabilityId"], None)
	fillResponse(response, r, originalResponse, err)
}

////////////////////////////////////////////////////////////////////////

func GetSensorTypes(response http.ResponseWriter, r *http.Request) {
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/sensorTypes", None)
	fillResponse(response, r, originalResponse, err)
}

func GetSensorTypeById(response http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	originalResponse, err := CallGetApi(config.Config.ApiRestPort, "/iot/edge/api/v1/sensorTypes/"+vars["sensorTypeId"], None)
	fillResponse(response, r, originalResponse, err)
}

////////////////////////////////////////////////////////////////////////

func fillResponse(response http.ResponseWriter, r *http.Request, originalResponse *http.Response, err error) {
	if err != nil {
		log.Printf("Unexpected error: %s", err)
		if originalResponse == nil {
			response.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	response.WriteHeader(originalResponse.StatusCode)

	defer originalResponse.Body.Close()
	originalBody, err := ioutil.ReadAll(originalResponse.Body)
	if err != nil {
		log.Printf("Unexpected error: %s", err)
		return
	}

	fmt.Fprint(response, string(originalBody))
}

func proxyGetApi(response http.ResponseWriter, r *http.Request, f func(string, string, AuthType) (*http.Response, error)) {
}
