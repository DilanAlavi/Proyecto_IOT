#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include "HX711.h"
//const char * WIFI_SSID = "COMTECO-N4197055";
//const char * WIFI_PASS = "VDLTT61050";
const char * WIFI_SSID = "real";
const char * WIFI_PASS = "11111111";

const char * MQTT_BROKER_HOST = "a1vcxnn8t7r7t-ats.iot.us-east-2.amazonaws.com";
const int MQTT_BROKER_PORT = 8883;

const char * MQTT_CLIENT_ID = "ESP-32";                                               

const char * UPDATE_TOPIC = "$aws/things/smart_trash/shadow/update";              
const char * SUBSCRIBE_TOPIC = "$aws/things/smart_trash/shadow/update/delta"; 

const char AMAZON_ROOT_CA1[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----

)EOF";

const char CERTIFICATE[] PROGMEM = R"KEY(
-----BEGIN CERTIFICATE-----
MIIDWjCCAkKgAwIBAgIVALC8TXGpDrl0TgksXTCrN27t9dS9MA0GCSqGSIb3DQEB
CwUAME0xSzBJBgNVBAsMQkFtYXpvbiBXZWIgU2VydmljZXMgTz1BbWF6b24uY29t
IEluYy4gTD1TZWF0dGxlIFNUPVdhc2hpbmd0b24gQz1VUzAeFw0yNDA1MTUwNDA2
NThaFw00OTEyMzEyMzU5NTlaMB4xHDAaBgNVBAMME0FXUyBJb1QgQ2VydGlmaWNh
dGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDZG8ZFxG1DxU7wyy0A
g6ixAxtyD6GkqSgWWMa9FaN5Mm1bUZ7yNrbcmKajkCnSHoQSwKl/xgLnvR+2g1zO
kvxfOiJwYI6xDZcIxyMRxlKiOqtaJKLaGy3jRmt5B7r/emZwLsVsasnH14iPm+07
lsMFWonDXtd9R7rmEa7rKrpKpug4CZYKvyi0Wmbc5ppTK1izqc7k2uLrX/b8tgwV
jnMI/STEm5b6XbtAf1luu/cpD1zlb9vKh0Zh+n+g4l651YbOVQwoVZRjrtPoNBAD
NY3wmw4WWo36xTtSMSWuiWfth0u/wbmBHXCTpHwcW0Gdke3p+F5aPctwuPREHa8i
OlWLAgMBAAGjYDBeMB8GA1UdIwQYMBaAFBhdfFraHGnGOs7GrQ+/TLc+BalfMB0G
A1UdDgQWBBT3nY2pD4CdzaeNWCGLPg6q/h8DkjAMBgNVHRMBAf8EAjAAMA4GA1Ud
DwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAQEAjW/yGHfjjcm9LPGJYa89v5GC
LS67j5sKFmAKGq6IhIJ/pfvAtEzyAWr8K9aZDw1irWl3axaU+y3XFVRKGHQCb21n
WNBRJ5A+TMLTRdXRR5HrX/o3sdAaLwuW4wgPw3DULXV+YY/3Xqy6x7EWLVAqFrfv
VpjEWnPUPL5x9PqhjAixeItyv/q6CBBuwHDBXr60VEDHMWtQtnMmvid27Bq/zGW8
qgWMTrQdpQqv5LOdamb4nK5w0Yx4UonZb9yxzfCBtYc9d64sMNeRGCuYdEuDdkZl
a9vnoqUZQVH33dJG0z/jQwNtJvBPjcdIbOzrBvTPbW57V9JX7i6xadb1eljloA==
-----END CERTIFICATE-----
)KEY";

const char PRIVATE_KEY[] PROGMEM = R"KEY(
-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEA2RvGRcRtQ8VO8MstAIOosQMbcg+hpKkoFljGvRWjeTJtW1Ge
8ja23Jimo5Ap0h6EEsCpf8YC570ftoNczpL8XzoicGCOsQ2XCMcjEcZSojqrWiSi
2hst40ZreQe6/3pmcC7FbGrJx9eIj5vtO5bDBVqJw17XfUe65hGu6yq6SqboOAmW
Cr8otFpm3OaaUytYs6nO5Nri61/2/LYMFY5zCP0kxJuW+l27QH9Zbrv3KQ9c5W/b
yodGYfp/oOJeudWGzlUMKFWUY67T6DQQAzWN8JsOFlqN+sU7UjElroln7YdLv8G5
gR1wk6R8HFtBnZHt6fheWj3LcLj0RB2vIjpViwIDAQABAoIBAFGQQqvBQL9eJ+sE
mZKA4+YkYbI3NyXyOtIyZe9xaqnEjRrqjgk3DvnPC4OVTHDY8AtPgB41mK/Q+FIM
BdjBlbh80aVgURspHN26Wm16EV9LJUbHTrsbzOB+ey/L/K+wHz30BE1XzRib230A
Ol7Ro9CmE+1m+xPg19FJQWqt8bDLVChSeyLIiPy2OmJzoCCrL0MjSJ7ab2XQw+0o
R8cA5QAqK/AFEDQ2FMoOP4Iu2wPJWZ6r6YNaaCFQkAAHdNlxvVBJsKOeXr/uvXHx
Cih+OvVPP9UL+3Jn4wBWZ0/amFdhyswvpX4U+ujuTZjopbRisMlgmWzp+mFb6nhA
KPqQknECgYEA+pni45oRPmh09r7UmFb/BFYbWo4+P179ZwYE0atx0N6cxl9WTpuF
bhTiPNXEs7gCSkxgUJd0viHrGX3Tlcfj+/8mjc9XJBrpI6RR30zSbnKQSnlhZBVV
pUOi31NEAM/zKYoZaiJxRgAqIn9pW9Datk5ueHEO4s9I5ZT2lfGv2UMCgYEA3ckr
fvgZ+utyE0UdA0gdO6BLDJQ3nObVEFARctGVAbrBkI/pSuTuBadwTW5CT7w+L9NN
fatfsCDG4fTF7hYhrOR3LHk3T09r7qomSzCOJ3OJzQUbgyU7dWft98TBib1o21mY
8hhz0le9yJhbZWDTZ0UEF9MVhmk+8NSz0UhQihkCgYBvgZO0ZHRxyXbp5+We127n
lgzb0VkfR3wHoGT6ioe9QaCOoBM+LPNFFSPJn/DDawgR2UQt+AZpJ5x9nkBMcEIg
edrE1NJYbWT5h/8qFfu4S1+q07GjH98ZByxspJcoqV7wR9OhJywx0pbs/LZ7tUXs
Qp/jFaNjBorQJOVHuN/fEwKBgH23k7VEM43dOmub6Kc8kH2FDiWSOrfwzOOTT2Cz
VnCFiUVFnis6+4Uu9WSe1G3YObPoZeuPYg03dyUMF8out2YGl1sZVvXZAkhmIJDM
dDf+sSUK+R5s03hosiaZXE+Uk0SLVDwfCkA4RjbXzi74JL1MDNboazImpGvlVgyS
njy5AoGATc21ggoDSqqFNC4dYzcf05CccQw04ljiIEZgyVq2433VBxoRiXHuVOIw
nms7YR0vXp63rJga5RaZNaaQFSABmQXjq6i3BLHodPvQphBXkF8e6Bfd75WzirhB
4rl94vPugtIMCcyJtU0/TmrLeDOWMHURGXdy+PVdh/n+tF4xhUY=
-----END RSA PRIVATE KEY-----
)KEY";
int LED = 2;

WiFiClientSecure wiFiClient;
PubSubClient mqttClient(wiFiClient);

StaticJsonDocument<JSON_OBJECT_SIZE(64)> inputDoc;
StaticJsonDocument<JSON_OBJECT_SIZE(4)> outputDoc;

char outputBuffer[128];
unsigned long previousPublishMillis = 0;
 
float previousDistance = 0.0;
float weight = 0.0;
unsigned char ESTADO_PUERTA = 0;
int echoPin = 26; 
int triggerPin = 27; 
  const int PIN_SCK = 5;
  const int PIN_DT = 15;
int DISTANCIA = 0;
const int SERVO_PIN = 23;
  Servo myServo;
  HX711 scale;

long readUltrasonicDistance(int triggerPin, int echoPin) {
  pinMode(triggerPin, OUTPUT); 
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);
  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(triggerPin, LOW);
  pinMode(echoPin, INPUT);
  
  // Leer el pulso y medir la duración del eco
  long duration = pulseIn(echoPin, HIGH);
  
  // Retardo ajustable entre las lecturas del sensor ultrasónico
  delay(500); 
  
  return duration;
}

void reportdoor() {
  outputDoc["state"]["reported"]["EcoTrash"] = ESTADO_PUERTA;
  outputDoc["state"]["reported"]["peso"] = weight;
  serializeJson(outputDoc, outputBuffer);
  mqttClient.publish(UPDATE_TOPIC, outputBuffer);
}
void liftServo() {


  myServo.attach(SERVO_PIN);
  scale.begin(PIN_DT, PIN_SCK);
  
  float calibration_factor = 130; 
  scale.set_scale(calibration_factor); 
  scale.tare(); 

  if (previousDistance < 10) {
    myServo.write(90); 
    delay(5000); 
    myServo.write(0); 
    delay(1000); 
  }
   weight = scale.get_units(3); 
  Serial.print("Lectura: ");
  Serial.print(weight, 3);
  Serial.println(" kg");
  
  delay(1000); 
}



void door() {
  if (ESTADO_PUERTA) 
  {
    digitalWrite(LED, HIGH);
     liftServo(); 
  } else {
    digitalWrite(LED, LOW);
  }
  reportdoor();
}

void callback(const char * topic, byte * payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) message += String((char) payload[i]);
  Serial.println("Message from topic " + String(topic) + ":" + message);
  DeserializationError err = deserializeJson(inputDoc, payload);
  if (!err) {
    if (String(topic) == SUBSCRIBE_TOPIC) {
      // Verificar si el estado del EcoTrash ha cambiado
      previousDistance = inputDoc["state"]["reported"]["distancia"].as<int>();
      unsigned char newEstadoPuerta = inputDoc["state"]["EcoTrash"].as<int8_t>();
      if (newEstadoPuerta != ESTADO_PUERTA) {
        ESTADO_PUERTA = newEstadoPuerta;
        door();
      }
    }
  }
}
 
void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(115200);

  Serial.print("Connecting to " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(200);
    Serial.print(".");
  }
  Serial.println(" Connected!");

  wiFiClient.setCACert(AMAZON_ROOT_CA1);
  wiFiClient.setCertificate(CERTIFICATE);
  wiFiClient.setPrivateKey(PRIVATE_KEY);

  mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  mqttClient.setCallback(callback);

  Serial.print("Connecting to " + String(MQTT_BROKER_HOST));
  if (mqttClient.connect(MQTT_CLIENT_ID)) {
    Serial.println(" Connected!");

    delay(100);
    mqttClient.subscribe(SUBSCRIBE_TOPIC);
    Serial.println("Subscribed to " + String(SUBSCRIBE_TOPIC));

    delay(100);
    reportdoor();
  }
}


void loop() {
  float distancia = 0.01723 * readUltrasonicDistance(triggerPin, echoPin);
  Serial.print("DISTANCIA*: ");
  Serial.println(distancia);
  if (mqttClient.connected()) {
    unsigned long now = millis();
    if (now - previousPublishMillis >= 2000) {
      previousPublishMillis = now;
      
      if (distancia != previousDistance) {
        previousDistance = distancia;
        outputDoc["state"]["reported"]["distancia"] = distancia;
        serializeJson(outputDoc, outputBuffer);
        mqttClient.publish(UPDATE_TOPIC, outputBuffer);
        Serial.print("DISTANCIA: ");
        Serial.println(distancia);
      }
    }
    
    mqttClient.loop();
  } else {
    Serial.println("MQTT broker not connected!");
    delay(2000);
  }
  
}