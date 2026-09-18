/*
V 1.0
Program dibuat berdasarkan contoh sketch :
 UDPSendReceiveString:
 */

#include <Ethernet.h>
#include <EthernetUdp.h>
#include "utility/w5100.h"
#include "pinAndConstant.h"

//-------------------------------
char checkResponse[] = "response";
char callBack[] = "online";
//----------------------------------------------------------------

// Pin untuk motor Belum Dipake

/*Parameter untuk motor
const int stepMode = 16; //Mode 1/16 langkah
const int fastSpeed = 1000;
unsigned long motorDelay;  //untuk menampung waktu dalam microdetik
const int pulseDelay = 1000; // dalam mikrodetik d
boolean togglePulse = HIGH; //
//----------------------------------------------------------------*/

// Diakses oleh bagian loop, dan connectionTimer 
unsigned long lastCommunicationTime = 0;
// Hanya bisa dirubah oleh fungsi connectionmonitor
bool connected = false;
//----------------------------------------------------------------

// Komunikasi Serial untuk
boolean startReading = false;
char response[20];
// ---------------------------------------------------------------


//----------------------------------------------------------------
int targetPort = 0;
IPAddress targetIP;
//----------------------------------------------------------------

// Enter a MAC address and IP address for your controller below.
// The IP address will be dependent on your local network:
byte mac[] = {
  0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xAC
};
IPAddress ip(192, 168, 1, 103);
unsigned int localPort = 8888;      // local port to listen on

// buffers for receiving and sending data
char packetBuffer[UDP_TX_PACKET_MAX_SIZE];  // buffer to hold incoming packet,
char ReplyBuffer[] = "acknowledged";        // a string to send back
int receivedPacketSize;
// Joystick
/*urutan:  
1. Analog x
2. analog y 
3. Analog z
4. Tombol
 * 
 */

int joystickButtonInput[] = {0,0,0,1};
boolean triggerButtonAlreadyPressed = false;
// -------------------------------

// Pemnaggilan Protokol keamanan ketika koneksi terputus
//Diakses oleh fungssi safetyProtocol
boolean isSafe = false;
//------------------------------------

// An EthernetUDP instance to let us send and receive packets over UDP
EthernetUDP Udp;

//-------------Motor----
int delayMotors= speedSlow;
float keliling = 125.6; //125.5 = 22mm @20000mm, 125.6 = 7mm @20000mm, 125.62 = 4mm @20000mm, 125.625 = ?mm @20000mm, 
bool flagInit=false;
bool ukurIsMundur=false;
bool flagReqPos=false;
String inputString=""; 
int value;
int posisi;
float stepsPerMM;

boolean runningSerialCommand = false;
boolean tooglePulse = false;
unsigned long pulseDelay = 0;
bool startukur = false;
bool joystick = false;
//----------------------------

void setup() {
  int i = 1;
  Serial.begin(115200);
  pinMode(LedRed, OUTPUT);
  pinMode(LedGreen, OUTPUT);
  digitalWrite(LedRed, LOW);
  digitalWrite(LedGreen, LOW);
  pinMode(stepPin, OUTPUT);
  pinMode(dirPin, OUTPUT);
  pinMode(ENABLE_PIN, OUTPUT);  
  pinMode(limitPin, INPUT_PULLUP); 
  stepsPerMM = (float)stepsPerRevolution/keliling;
  
  initEthernet(); 
  readIncomingData(); 
  //MoveKiri_Init();
}

void loop() {
  // Melakukan pengecekkan koneksi apabila komunikasi terakhir lebih dari 1000.
    
    readIncomingData(); 
    connectionMonitorSlave(); 
    LEDControl(); 
    // Jika pesan yang masuk merupakan pesan untuk pengecekan koneksi maka balas dengan kata sandi di variabel callback
    checkIfRequestAcknowled();
    
    // Masukkan fungsi ke dalam if di bawah apabila harus berjalan dalam kondisi terhubung
    if (connected){
       if (packetBuffer[0] != '\0'){
          saveJoyStickInput();
       }
       // fungsi joystick tidak akan mengganggu fungsi serial karena seluruh fungsi serial menerapkan blocking
       //if(joystick == true) joystickControl();
       joystickControl();
              
       // Menyatakan kondisi dikatakan aman karena pengguna masih mengontrol proses
       isSafe = false;
    }
    else{
      safetyProtocol();
    }
}

void initEthernet(){
  // start the Ethernet
  Ethernet.begin(mac, ip);

  // Check for Ethernet hardware present
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    Serial.println("Ethernet shield was not found.  Sorry, can't run without hardware. :(");
    while (true) {
      delay(1); // do nothing, no point running without Ethernet hardware
    }
  }

  if (Ethernet.linkStatus() == LinkOFF) {
    Serial.println("Ethernet cable is not connected.");
  }

  // start UDP
  Udp.begin(localPort);
}


void connectionMonitorSlave(){
    // Jika fungsi dipanggil untuk memonitor koneksi yang terhubung ke slave, slave hanya menerima komunikasi dan tidak melakukan fungsi koneksi ulang dengan sender, biar sender yang bertugas.
    if ((millis()-lastCommunicationTime) > connectionTimeout){
      // Jika Fungsi sebelumnya telah mengirimkan pesan untuk memeriksa koneksi tapi belum dibalas juga maka komunikasi telah terputus
      if (connected){
        //Serial.println("Koneksi telah terputus");
        connected = false;
      }
    }
}

void readIncomingData(){
  receivedPacketSize = Udp.parsePacket();
  packetBuffer[0] = '\0';
  if (receivedPacketSize) {
    memset(packetBuffer, 0, sizeof packetBuffer);
    Udp.read(packetBuffer, UDP_TX_PACKET_MAX_SIZE);
    targetIP = Udp.remoteIP();
    targetPort = Udp.remotePort();
    //Serial.println(packetBuffer);
    // Komunikasi telah terdeteksi nyatakan bahwa perangkat telah terkoneksi  dan reset waktu timeout.
    connected = true;
    lastCommunicationTime = millis();
  }
}

void sendComunication(char* message){
    Udp.beginPacket(targetIP, targetPort);
    Udp.write(message);
    Udp.endPacket();
}

void LEDControl(){
  //Nyalakan LED Hijau kalau komunikasi terkoneksi
  if (connected){
    digitalWrite(LedRed,LOW);
    digitalWrite(LedGreen,HIGH);
  }
  //Nyalakan LED Merah kalau komunikasi terkoneksi
  else{
    digitalWrite(LedRed,HIGH);
    digitalWrite(LedGreen,LOW);
  }
}

void extendsTimeout(){
  // Sebenarny fungsi hanya pemanis supaya mudah digunakan dan dimengerti, fungsinya hanya untuk mereset waktu timeout supaya menyatakan perangkat masih terkoneksi 
  lastCommunicationTime = millis(); 
}

void checkIfRequestAcknowled(){
  if (strcmp(packetBuffer,checkResponse)==0){
  sendComunication(callBack);
  extendsTimeout();  
  }
}

void saveJoyStickInput(){
  char tempChar[4]; //bisa menampung data ratusan
  //char jotempCharystickData[20];
  int charCounter = 0;
  int counter = 0;
  if (packetBuffer[0]=='@'&&packetBuffer[receivedPacketSize-1]=='?'){
    if(packetBuffer[1]=='J'){
      for (int i = 0;i<receivedPacketSize - 3;i++){    // Pembacaan mulai dari posisi ketiga
        if( packetBuffer[3+i]=='_' || packetBuffer[3+i]=='?'){
          tempChar[charCounter] = '\0';
          joystickButtonInput[counter]=atoi(tempChar);
          charCounter = 0;
          counter++;
        }
        else{
          tempChar[charCounter] = packetBuffer[3+i];
          charCounter++;
        }

        /*
        joystickButtonInput[i] =(int)packetBuffer[3+(i*2)]-'0';
        if (i==5) Serial.println(joystickButtonInput[i]);
        else Serial.print(joystickButtonInput[i]);
        */
      }
    }
  }
}

void safetyProtocol(){
  // Fungsi hanya dijalankan sekalo ketika koneksi terputus
  // Fungsi mereset input Joystick
  // Fungsi mematikan fungsi dari existing driver
  // Hapus if jika ingin di buat berulang
  if (isSafe == false){
    joystickButtonInput[0]=ANALOG_MIDDLE_VALUE;
    joystickButtonInput[1]=ANALOG_MIDDLE_VALUE;
    joystickButtonInput[2]=ANALOG_MIDDLE_VALUE;
    joystickButtonInput[3]=1;

    digitalWrite(ENABLE_PIN, LOW);
    digitalWrite(stepPin, LOW);
    isSafe = true;
  }
}
