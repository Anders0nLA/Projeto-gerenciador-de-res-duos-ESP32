#include <WiFi.h>
#include <HTTPClient.h>  

#define WIFI_SSID "InternetTeste"
#define WIFI_PASSWORD "12345678"

#define PIN_TRIG 13
#define PIN_ECHO 14 

const float ALTURA_LIXEIRA = 10.0;      
const float ALTURA_BASE = 2.0;           
const float ALTURA_CHEIA = 3.0;          
const float LIMITE_TAMPA_ABERTA = 14.0;  

float distancia_medida = 0;
float porcentagem_lixo = 0;
bool tampa_aberta = false;

String firebaseURL = "https://gerenciador-de-residuos-cec4a-default-rtdb.firebaseio.com/lixeira.json";

bool verificarTampaAberta(float distancia) {
  bool aberta = distancia > LIMITE_TAMPA_ABERTA;
  
  if (aberta && !tampa_aberta) {
    Serial.println("TAMPA ABERTA detectada");
  } else if (!aberta && tampa_aberta) {
    Serial.println("Tampa FECHADA");
  }
  
  tampa_aberta = aberta;
  return aberta;
}

String getStatusLixeira(float porcentagem, bool tampa_aberta) {
  if (tampa_aberta) return "tampa_aberta";
  if (porcentagem >= 90) return "cheia";
  else if (porcentagem >= 70) return "quase_cheia";
  else return "normal";
}

void enviarFirebase(float distancia, float porcentagem) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(firebaseURL);
    http.addHeader("Content-Type", "application/json");

    String status = getStatusLixeira(porcentagem, tampa_aberta);
    
    String json = "{";
    json += "\"distancia\":" + String(distancia, 1) + ",";
    json += "\"porcentagem\":" + String(porcentagem, 1) + ",";
    json += "\"status\":\"" + status + "\",";
    json += "\"tampaAberta\":" + String(tampa_aberta ? "true" : "false") + ",";
    json += "\"local\":\"Sala 01\",";
    json += "\"capacidade\":10,";  
    json += "\"atualizadoEm\":\"" + String(millis()) + "\"";
    json += "}";

    int httpResponseCode = http.PUT(json);

    Serial.print("Firebase resposta: ");
    Serial.println(httpResponseCode);

    http.end();
  } else {
    Serial.println("WiFi desconectado! Não foi possível enviar ao Firebase.");
  }
}

float medirDistanciaCM() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duracao = pulseIn(PIN_ECHO, HIGH, 30000);

  if (duracao == 0) {
    Serial.println("Erro: Sensor não detectado");
    return -1;
  }

  float distancia = duracao * 0.0343 / 2;

  if (distancia > 50 || distancia < 0) {
    Serial.println("Leitura inválida ignorada");
    return -1;
  }

  return distancia;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  Serial.println("=== LIXEIRA INTELIGENTE 10cm ===");
  Serial.println("Calibração: 10cm=vazia, 3cm=cheia");
  Serial.println("Detecção de tampa: >14cm = aberta");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Conectado!");
}

void loop() {
  distancia_medida = medirDistanciaCM();

  if (distancia_medida > 0) {
    bool tampa_esta_aberta = verificarTampaAberta(distancia_medida);
    
    if (tampa_esta_aberta) {
      Serial.println("Tampa ABERTA - Medição suspensa");
      enviarFirebase(distancia_medida, 0);
    } else {
      // Tampa fechada - processa medição normal
      if (distancia_medida > ALTURA_LIXEIRA) distancia_medida = ALTURA_LIXEIRA;
      if (distancia_medida < ALTURA_BASE) distancia_medida = ALTURA_BASE;

      porcentagem_lixo = ((ALTURA_LIXEIRA - distancia_medida) / (ALTURA_LIXEIRA - ALTURA_CHEIA)) * 100.0;
      
      if (porcentagem_lixo > 100) porcentagem_lixo = 100;
      if (porcentagem_lixo < 0) porcentagem_lixo = 0;

      Serial.print("Distancia: ");
      Serial.print(distancia_medida, 1);
      Serial.print(" cm | Nivel: ");
      Serial.print(porcentagem_lixo, 1);
      Serial.println(" %");

      if (porcentagem_lixo >= 90) {
        Serial.println("ALERTA: Lixeira CHEIA!");
      } else if (porcentagem_lixo >= 70) {
        Serial.println("Atenção: Lixeira QUASE CHEIA");
      } else if (porcentagem_lixo >= 50) {
        Serial.println("Metade da capacidade");
      } else {
        Serial.println("Lixeira com espaço");
      }

      enviarFirebase(distancia_medida, porcentagem_lixo);
    }
  } else {
    Serial.println("Aguardando leitura válida do sensor...");
  }

  delay(2000);
}