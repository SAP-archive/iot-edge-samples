package apis

import (
	"app/internal/config"
	"fmt"
	"io/ioutil"
	"log"
	"strings"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/patrickmn/go-cache"
)

var msgCache *cache.Cache

func init() {
	log.Println("Initializing Cache for keeping Mqtt Bus messages")
	// Create a cache with a default expiration time of 5 minutes, and which purges expired items every 10 minutes
	msgCache = cache.New(5*time.Minute, 10*time.Minute)
	log.Println("Cache initialized with success")
}

var mqttBusDefaultPubHandler mqtt.MessageHandler = func(client mqtt.Client, msg mqtt.Message) {
	// Log the msg
	log.Printf("Received message from the Mqtt Bus topic %s:\n%s\n", msg.Topic(), msg.Payload())
}

var mqttBusCacheMsgPubHandler mqtt.MessageHandler = func(client mqtt.Client, msg mqtt.Message) {
	sourceTopic := msg.Topic()
	textMsg := string(msg.Payload())
	// Log the msg
	log.Printf("Received message from the Mqtt Bus topic %s:\n%s\n", sourceTopic, textMsg)
	// Update the cache
	updateMsgCache(sourceTopic, textMsg)
}

var mqttBusConnectHandler mqtt.OnConnectHandler = func(client mqtt.Client) {
	log.Println("Connected to the Mqtt Bus")
}

var mqttBusConnectLostHandler mqtt.ConnectionLostHandler = func(client mqtt.Client, err error) {
	log.Printf("Connection to the Mqtt Bus got lost: %v", err)
}

var mqttBusClient mqtt.Client

func ConnectToBus() error {

	if mqttBusClient != nil && mqttBusClient.IsConnected() {
		log.Println("Client already connected to the MQTT Bus")
		return nil
	}

	busBroker := fmt.Sprintf("tcp://%s:%s", config.Config.ServerUrl, config.Config.MqttBusPort)
	log.Printf("Going to connect to the MQTT Bus at: %s", busBroker)

	opts := mqtt.NewClientOptions()
	opts.AddBroker(busBroker)

	opts.SetClientID(readNamespace())
	opts.SetUsername("test-extension-service")
	opts.SetPassword(readKubernetesToken())

	opts.SetDefaultPublishHandler(mqttBusDefaultPubHandler)
	opts.OnConnect = mqttBusConnectHandler
	opts.OnConnectionLost = mqttBusConnectLostHandler

	mqttBusClient = mqtt.NewClient(opts)

	if token := mqttBusClient.Connect(); token.Wait() && token.Error() != nil {
		return token.Error()
	} else {
		return nil
	}
}

func readKubernetesToken() string {
	jwt, err := ioutil.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		log.Fatalf("Not able to read the kubernetes token due to: %s", err)
	}
	return string(jwt)
}

func readNamespace() string {
	namespace, err := ioutil.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/namespace")
	if err != nil {
		log.Fatalf("Not able to read the kubernetes namespace due to: %s", err)
	}
	return string(namespace)
}

func SendToBusIngressTopic(message string) error {
	return send(getBusIngressTopic(), message)
}

func SendToBusCustomTopic(topic, message string) error {
	return send(topic, message)
}

func send(destination string, message string) error {
	log.Printf("Sending message '%s' to the destination '%s'", message, destination)
	if token := mqttBusClient.Publish(destination, 0, false, message); token.Wait() && token.Error() != nil {
		log.Printf("Not able to send the message to the destination '%s' due to: %s", destination, token.Error())
		return token.Error()
	} else {
		log.Printf("Message sent to the destination: '%s'", destination)
		return nil
	}
}

func SubscribeToBusEgressTopic() error {
	return subscribe(getBusEgressTopic(), mqttBusCacheMsgPubHandler)
}

func SubscribeToBusCustomTopic(topic string) error {
	return subscribe(topic, mqttBusCacheMsgPubHandler)
}

func subscribe(destination string, callback mqtt.MessageHandler) error {
	if token := mqttBusClient.Subscribe(destination, 1, callback); token.Wait() && token.Error() != nil {
		log.Printf("Not able to subscribe to the destination '%s' due to: %s", destination, token.Error())
		return token.Error()
	} else {
		log.Printf("Subscribed to destination: '%s'", destination)
		return nil
	}
}

func DisconnectFromBus() {
	log.Printf("Disconnecting client from Mqtt Bus")
	mqttBusClient.Disconnect(250)
	log.Printf("Client disconnected from Mqtt Bus")
}

func ReadMessagesReceivedFromBusEgressTopic() []string {
	return readMessagesReceivedFromTopic(getBusEgressTopic())
}

func ReadMessagesReceivedFromCustomTopic(topic string) []string {
	return readMessagesReceivedFromTopic(topic)
}

func readMessagesReceivedFromTopic(topic string) []string {
	var messages []string
	// read the cache
	messagesCached, found := msgCache.Get(topic)
	if found {
		messages = messagesCached.([]string)
		//empty the cache
		msgCache.Delete(topic)
	}
	return messages
}

func updateMsgCache(topic, msg string) {
	var messages []string
	messagesCached, found := msgCache.Get(topic)
	if found {
		messages = messagesCached.([]string)
	}
	messages = append(messages, msg)
	msgCache.Set(topic, messages, cache.NoExpiration)
	log.Printf("A new msg has been added to the cache for key '%s' that currently consists of %d items", topic, len(messages))
}

func getBusEgressTopic() string {
	return "iot/edge/v1/" + getEdgeGatewayServiceNamespace() + "/measures/out"
}

func getBusIngressTopic() string {
	return "iot/edge/v1/" + getEdgeGatewayServiceNamespace() + "/measures/in"
}

func getEdgeGatewayServiceNamespace() string {
	edgeGatewayServiceNamespace := "sap-iot-gateway"
	serverUrl := config.Config.ServerUrl
	if serverUrl != "" && strings.Contains(serverUrl, ".") {
		split := strings.Split(serverUrl, ".")
		edgeGatewayServiceNamespace = split[1]
	}
	return edgeGatewayServiceNamespace
}
