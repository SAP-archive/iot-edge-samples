package config

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/spf13/viper"
)

type Bindings struct {
	Bindings []Binding
}

type Binding struct {
	Type, Id, Api, Url string
}

type TestConfig struct {
	ServerUrl, ApiRestPort, MqttBusPort string
}

var Config TestConfig

func init() {
	log.Println("Initializing Extension Service configuration")

	// load the config file
	loadConfigFile()

	// Parse default config
	buildDefaultTestConfig()

	// Update the default config with info coming from the service bindings
	serviceBindings := os.Getenv("SERVICE_BINDINGS")
	if serviceBindings != "" {
		updateConfigFromServiceBindings(serviceBindings)
	}

	log.Printf("Extension Service configuration is: %+v\n", Config)
}

func GetConfig(w http.ResponseWriter, r *http.Request) {
	log.Println("Endpoint Hit: getConfig")
	json.NewEncoder(w).Encode(Config)
}

func UpdateConfig(w http.ResponseWriter, r *http.Request) {
	log.Printf("Endpoint Hit: updateConfig %v", Config)
	json.NewDecoder(r.Body).Decode(&Config)
}

func loadConfigFile() {
	log.Println("Load config .yaml file")
	// Set the file name of the configuration file
	viper.SetConfigName("config")
	// Set the path to look for the configuration file
	viper.AddConfigPath("./internal/config")
	// Enable VIPER to read Environment Variables
	viper.AutomaticEnv()
	viper.SetConfigType("yml")
	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Error reading config file, %s", err)
	}
}

func updateConfigFromServiceBindings(serviceBindings string) {

	// Update default Bindings from Service Bindings
	log.Printf("Updating default config from Service Bindings value: %s\n", serviceBindings)

	var bindings Bindings
	json.Unmarshal([]byte(serviceBindings), &bindings)
	for i, binding := range bindings.Bindings {

		parsedUrl, err := url.Parse(binding.Url)
		if err != nil {
			continue
		}
		switch binding.Type {
		case ("MQTT"):
			Config.MqttBusPort = parsedUrl.Port()
			Config.ServerUrl = parsedUrl.Hostname()
		case ("REST"):
			Config.ApiRestPort = parsedUrl.Port()
		default:
			log.Printf("Type %s in position %d cannot be parsed", binding.Type, i)
		}
	}
}

func buildDefaultTestConfig() {

	serverUrl := viper.GetString("defaultServiceBindings.host")
	apiRestPort := viper.GetString("defaultServiceBindings.apiRestPort")
	mqttBusPort := viper.GetString("defaultServiceBindings.mqttBusPort")

	Config = TestConfig{ServerUrl: serverUrl,
		ApiRestPort: apiRestPort, MqttBusPort: mqttBusPort}
}
