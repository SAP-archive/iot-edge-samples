package apis

import (
	"app/internal/config"
	"io"
	"io/ioutil"
	"log"
	"net/http"
)

type AuthType int

const (
	None AuthType = iota // None = 0
	Jwt                  // Jwt = 1
	Ssl                  // Ssl = 2
)

func CallGetApi(port, subpath string, auth AuthType) (*http.Response, error) {

	completeURL := buildTargetUrl(port, subpath)
	log.Printf("Invoking %s", completeURL)

	request, err := http.NewRequest("GET", completeURL, nil)
	if err != nil {
		return nil, err
	}
	if auth == Jwt {
		addAuthHeader(request)
	}
	// Send req using http Client
	client := &http.Client{}
	return client.Do(request)
}

func CallPostApi(port, subpath string, body io.Reader, auth AuthType) (*http.Response, error) {
	completeURL := buildTargetUrl(port, subpath)
	log.Printf("Invoking %s", completeURL)

	request, err := http.NewRequest("POST", completeURL, body)
	if err != nil {
		return nil, err
	}
	if auth == Jwt {
		addAuthHeader(request)
	}
	request.Header.Set("Content-Type", "application/json")
	// Send req using http Client
	client := &http.Client{}
	return client.Do(request)
}

func buildTargetUrl(port, subpath string) string {
	return "http://" + config.Config.ServerUrl + ":" + port + subpath
}

func addAuthHeader(request *http.Request) {
	jwt, err := ioutil.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		log.Println("Cannot read kubernetes token")
	}
	bearer := "Bearer " + string(jwt)
	request.Header.Add("Authorization", string(bearer))
}
