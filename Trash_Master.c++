#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Servo.h>
#include <HX711.h>

// Definiciones de pines y constantes
const int LED = 2; // Ejemplo de pin para el LED
const char* WIFI_SSID = "tu_wifi_ssid";
const char* WIFI_PASS = "tu_wifi_pass";
const char* MQTT_BROKER_HOST = "mqtt.tuhost.com";
const int MQTT_BROKER_PORT = 1883; // Puerto MQTT por defecto
const char* MQTT_CLIENT_ID = "tu_client_id";
const char* SUBSCRIBE_TOPIC = "topic/subscripcion";
const char* UPDATE_TOPIC = "topic/actualizacion";
const char* AMAZON_ROOT_CA1 = "root_ca.pem"; // Certificado de CA de Amazon
const char* CERTIFICATE = "cert.pem";
const char* PRIVATE_KEY = "key.pem";
const int echoPin = 26; // Pin del sensor echo
const int triggerPin = 27; // Pin de trig del sensor
const int PIN_SCK = 5;
const int PIN_DT = 15;
const int SERVO_PIN = 23;

class UltrasonicSensor {
private:
  int triggerPin;
  int echoPin;

public:
  UltrasonicSensor(int triggerPin, int echoPin) : triggerPin(triggerPin), echoPin(echoPin) {}

  long readDistance() {
    pinMode(triggerPin, OUTPUT);
    digitalWrite(triggerPin, LOW);
    delayMicroseconds(2);
    digitalWrite(triggerPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(triggerPin, LOW);
    pinMode(echoPin, INPUT);

    long duration = pulseIn(echoPin, HIGH);
    delay(500); 

    return duration;
  }
};

class DoorController {
private:
  Servo myServo;
  HX711 scale;

public:
  DoorController() {}

  void liftServo(float previousDistance) {
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

    float weight = scale.get_units(3);
    Serial.print("Lectura: ");
    Serial.print(weight, 3);
    Serial.println(" kg");

    delay(1000);
  }
};

class MqttHandler {
private:
  WiFiClientSecure& wiFiClient;
  PubSubClient& mqttClient;

public:
  MqttHandler(WiFiClientSecure& wiFiClient, PubSubClient& mqttClient) : wiFiClient(wiFiClient), mqttClient(mqttClient) {}

  void setupMqtt() {
    wiFiClient.setCACert(AMAZON_ROOT_CA1);
    wiFiClient.setCertificate(CERTIFICATE);
    wiFiClient.setPrivateKey(PRIVATE_KEY);

    mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  }

  void connectToBroker() {
    Serial.print("Connecting to ");
    Serial.print(MQTT_BROKER_HOST);
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println(" Connected!");
      mqttClient.subscribe(SUBSCRIBE_TOPIC);
      Serial.println("Subscribed to " + String(SUBSCRIBE_TOPIC));
    } else {
      Serial.println(" Connection failed!");
    }
  }

  void handleMqtt() {
    mqttClient.loop();
  }

  void publishMessage(const char* topic, const char* message) {
    mqttClient.publish(topic, message);
  }
};

class Main {
private:
  WiFiClientSecure wiFiClient;
  PubSubClient mqttClient;
  UltrasonicSensor ultrasonicSensor;
  DoorController doorController;
  MqttHandler mqttHandler;
  long previousDistance = 0;

public:
  Main() : ultrasonicSensor(triggerPin, echoPin), mqttHandler(wiFiClient, mqttClient) {}

  void setup() {
    pinMode(LED, OUTPUT);
    Serial.begin(115200);

    Serial.print("Connecting to ");
    Serial.print(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
      delay(200);
      Serial.print(".");
    }
    Serial.println(" Connected!");

    mqttHandler.setupMqtt();
    mqttHandler.connectToBroker();
  }

  void loop() {
    float distancia = 0.01723 * ultrasonicSensor.readDistance();
    Serial.print("DISTANCIA***: ");
    Serial.println(distancia);
    if (mqttClient.connected()) {
      unsigned long now = millis();
      if (now - previousPublishMillis >= 2000) {
        previousPublishMillis = now;

        if (distancia != previousDistance) {
          previousDistance = distancia;
          StaticJsonDocument<JSON_OBJECT_SIZE(64)> outputDoc;
          outputDoc["state"]["reported"]["distancia"] = distancia;
          char outputBuffer[128];
          serializeJson(outputDoc, outputBuffer);
          mqttHandler.publishMessage(UPDATE_TOPIC, outputBuffer);
          Serial.print("DISTANCIA: ");
          Serial.println(distancia);
        }
      }

      mqttHandler.handleMqtt();
    } else {
      Serial.println("MQTT broker not connected!");
      delay(2000);
    }
  }
};

Main main; // Instancia de la clase principal

void setup() {
  main.setup();
}

void loop() {
  main.loop();
}
