//Waktu timeout sedikit berbeda dari receiver untuk memberikan waktu ekstra jika sender sedikit terlambay untuk memeriksa komunikasi
#define connectionTimeout 2000
// Pin Untuk LED
#define LedRed  7
#define LedGreen  8

//------Konfigurasi Joystick ------
#define ANALOG_Z_MAX 100
#define ANALOG_Z_MIN 0
#define ANALOG_Z_CORRECTION 5
#define ANALOG_MIDDLE_VALUE 50
//--------------------------------


//-----Konfigurasi untuk motor--------------------
#define dirPin 5 
#define stepPin 4
#define limitPin 2
#define stepsPerRevolution 3200 // sesuaikan dengan settingan SW1-SW3 pada modul motor driver
#define speedFast 30 //312.6 rpm
#define speedMedium 100
#define speedSlow 500 //18.75 rpm
#define speedSlow2 5000
#define speedSlow3 10000

#define ENABLE_PIN 6 //Untuk apa?
//----------------------------------------------------------------
