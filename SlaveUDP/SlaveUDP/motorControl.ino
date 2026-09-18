void motorSetup() {
  
}

float findMod(float a, float b)
{
    float mod;
    // Handling negative values
    if (a < 0) mod = -a;
    else mod =  a;
    if (b < 0) b = -b;
 
    // Finding mod by repeated subtraction
    while (mod >= b) mod = mod - b;
 
    // Sign of result typically depends
    // on sign of a.
    if (a < 0) return -mod;
 
    return mod;
}

void MoveKiri_Init()
{
  delayMotors = speedSlow;
  digitalWrite(dirPin, HIGH); // HIGH - putar searah jarum jam  
  for(;;){
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
    if(digitalRead(limitPin) == 1) break;
    digitalWrite(stepPin, LOW);
    delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
    if(digitalRead(limitPin) == 1) break;
  }
  posisi=0;  
}

void MoveKiri_Home()
{
  /*int i;
  delayMotors = 400;
  digitalWrite(dirPin, HIGH); // HIGH - putar searah jarum jam  
  for(;;){
    i++;
    //Serial.print("Count " ); Serial.println(i);
    //Serial.print("Speed " ); Serial.println(delayMotors);
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
    if(i >= 3000) {
      i=0;
      break;
    }
    digitalWrite(stepPin, LOW);
    delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
    if(i >= 3000) {
      i=0;
      break;
    }
  }
  */
  delayMotors = 250; //500 very  slow, 100 medium
  digitalWrite(dirPin, HIGH); // HIGH - putar searah jarum jam  
  for(;;){
    //Serial.print("Speed " ); Serial.println(delayMotors);
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
    if(digitalRead(limitPin) == 1) break;
    digitalWrite(stepPin, LOW);
    delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
    if(digitalRead(limitPin) == 1) break;
  }
  posisi=0;  
}

void MoveKiriByRot(int rotation)
{
  bool flagInc=true;
  delayMotors = speedSlow;
  digitalWrite(dirPin, HIGH); // HIGH - putar searah jarum jam  
  if((rotation >2)){
    for (int j = 0; j < rotation; j++) {
      if(j == (rotation-1)) flagInc=false;
      for (int i = 0; i < stepsPerRevolution; i++) {
         if((i % 30 == 0) && flagInc) delayMotors=delayMotors-1;
        if((i % 40 == 0) && !flagInc) delayMotors=delayMotors+1;
        if(delayMotors < speedFast) delayMotors = speedFast;
        if(delayMotors > speedSlow) delayMotors = speedSlow;
        digitalWrite(stepPin, HIGH);
        delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
        digitalWrite(stepPin, LOW);
        delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
      }
    }
  }
  else{
    for (int j = 0; j < rotation; j++) {
      for (int i = 0; i < stepsPerRevolution; i++) {
        digitalWrite(stepPin, HIGH);
        delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
        digitalWrite(stepPin, LOW);
        delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
      }
    }
  }
}

void MoveKiriByMM(int pos)
{
  int rotation, sisa;
  
  rotation = pos/keliling;
  
  if(rotation < 1 || rotation > 2) delayMotors = speedSlow;
  else delayMotors = speedMedium;
  MoveKiriByRot(rotation);  
  
  sisa = (int)(findMod(pos, keliling)*stepsPerMM);
  delayMotors = speedSlow;
  //  Serial.print(sisa, DEC);
  for (int i = 0; i < sisa; i++) {
      digitalWrite(stepPin, HIGH);
      delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
      digitalWrite(stepPin, LOW);
      delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
  }  
}

void MoveKananByRot(int rotation)
{
  bool flagInc=true;
  delayMotors = speedSlow;
  digitalWrite(dirPin, LOW); // Low - putar berlawanan jarum jam
  if((rotation >2)){
    for (int j = 0; j < rotation; j++) {
      if(j == (rotation-1)) flagInc=false;
      for (int i = 0; i < stepsPerRevolution; i++) {
        if((i % 30 == 0) && flagInc) delayMotors=delayMotors-1;
        if((i % 40 == 0) && !flagInc) delayMotors=delayMotors+1;
        if(delayMotors < speedFast) delayMotors = speedFast;
        if(delayMotors > speedSlow) delayMotors = speedSlow;
        digitalWrite(stepPin, HIGH);
        delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
        digitalWrite(stepPin, LOW);
        delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
      }
    }
  }
  else{
    for (int j = 0; j < rotation; j++) {
      for (int i = 0; i < stepsPerRevolution; i++) {
        digitalWrite(stepPin, HIGH);
        delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
        digitalWrite(stepPin, LOW);
        delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
      }
    }
  }
}

void MoveKananByMM(int pos)
{
  int rotation, sisa;
  
  rotation = pos/keliling;
  
  if(rotation < 1 || rotation > 2) delayMotors = speedSlow;
  else delayMotors = speedMedium;
  MoveKananByRot(rotation);  
    
  sisa = (int)(findMod(pos, keliling)*stepsPerMM); 
  delayMotors = speedSlow;
  //  Serial.print(sisa, DEC);
  for (int i = 0; i < sisa; i++) {
      digitalWrite(stepPin, HIGH);
      delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
      digitalWrite(stepPin, LOW);
      delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
  }  
}

void UjiKananByMM(int pos)
{
  int rotation, sisa;
  //rotation = pos/keliling;
  //sisa = (int)(findMod(pos, keliling)*stepsPerMM); 
  sisa = pos;
  digitalWrite(dirPin, LOW); // Low - putar berlawanan jarum jam
  delayMotors = speedSlow2;
  for (int i = 0; i < sisa; i++) {
      digitalWrite(stepPin, HIGH);
      delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
      digitalWrite(stepPin, LOW);
      delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
  }  
}

void UjiKiriByMM(int pos)
{
  int rotation, sisa;
  //rotation = pos/keliling;
  //sisa = (int)(findMod(pos, keliling)*stepsPerMM); 
  sisa = pos;
  digitalWrite(dirPin, HIGH); // Low - putar berlawanan jarum jam
  delayMotors = speedSlow2;
  for (int i = 0; i < sisa; i++) {
      digitalWrite(stepPin, HIGH);
      delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
      digitalWrite(stepPin, LOW);
      delayMicroseconds(delayMotors); // ganti delay untuk mempercepat motor
  }  
}

void MoveUkurMaju()
{
  delay(1000); // delay miliseconds
  
  Serial.print("ACK"); 
  UjiKananByMM(260); // 
  delay(1000); // delay miliseconds
  
  UjiKiriByMM(261);  //
  delay(1000); // delay miliseconds
  Serial.print("OK");
}

void MoveUkurMundur()
{
  delay(1000); // delay miliseconds
  
  Serial.print("ACK");
  UjiKiriByMM(260);  //
  delay(1000); // delay miliseconds

  UjiKananByMM(267); //
  delay(1000); // delay miliseconds
  Serial.print("OK");
}
void UjiKanan(int sisa)
{
  digitalWrite(dirPin, LOW); // Low - putar berlawanan jarum jam
  for (int i = 0; i < sisa; i++) {
      digitalWrite(stepPin, HIGH);
      delay(10); // ganti delay untuk mempercepat motor
      digitalWrite(stepPin, LOW);
      delay(10); // ganti delay untuk mempercepat motor
  }  
}


void UjiKiri(int sisa)
{
  digitalWrite(dirPin, HIGH); // Low - putar berlawanan jarum jam
  for (int i = 0; i < sisa; i++) {
      digitalWrite(stepPin, HIGH);
      delay(10); // ganti delay untuk mempercepat motor
      digitalWrite(stepPin, LOW);
      delay(10); // ganti delay untuk mempercepat motor
  }  
}
void serialEvent() {
  while (Serial.available()) {
    // get the new byte:
    char inChar = (char)Serial.read();

    if(flagReqPos){
      if(inChar== '\r'){
        //--------------------- do code here ------------------------//
        delay(500); // delay miliseconds
        
        value=(int)inputString.toInt();

        if (value == 0){ // command go to 0 position
           value = 300; // then go to 30 centimeter
           if (value<posisi)MoveKiriByMM(posisi-value); 
           MoveKiri_Init(); // init find 
        }
        else{
           if(value>posisi)MoveKananByMM(value-posisi);
           else if (value<posisi)MoveKiriByMM(posisi-value);        
           posisi=value;
        }        
        flagReqPos=false;
        inputString="";
      }
      else{
        inputString += inChar;
      }
    }
    else{
      if (inChar == '@'){
        flagReqPos=true;
        joystick = false;
      }
      else if (inChar == 'x'){      
        Serial.print("READY");
        //MoveKiri_Init(); sebelumnya ini   
        MoveKiri_Home(); //Ganti ini untuk mempercepat ke home        
      }
      else if (inChar == 'y'){      
        Serial.print("OK");   
        //digitalWrite(dirPin, LOW);
        //digitalWrite(stepPin, HIGH);
        //delayMicroseconds(3000); // ganti delay untuk mempercepat motor
        //digitalWrite(stepPin, LOW);
        //delayMicroseconds(3000); // ganti delay untuk mempercepat motor   
        //UjiKanan(200); //
        //delay(1000);
        //UjiKiri(200); //
      }
      else if (inChar == 'z'){      
        Serial.print("OK");   
        //digitalWrite(dirPin, HIGH);
        //digitalWrite(stepPin, HIGH);
        //delayMicroseconds(3000); // ganti delay untuk mempercepat motor
        //digitalWrite(stepPin, LOW);
        //delayMicroseconds(3000); // ganti delay untuk mempercepat motor   
        //UjiKiri(196); //
        //delay(1000);
        //UjiKanan(200); //
      }
      else if(inChar=='%' || inChar=='#' || startukur==true ){
        if(inChar=='%')ukurIsMundur=false;
        if(!ukurIsMundur){
          ukurIsMundur=true; 
          MoveUkurMaju();
        }
        else{
          ukurIsMundur=false; 
          MoveUkurMundur();
        }
        startukur==false;
      }
    }
    inChar = NULL;
  }  
}

void joystickControl(){
  // Gerakan joystick Puter
  moveMotorByAnalog();

  if (joystickButtonInput[3] == 0 && !triggerButtonAlreadyPressed){
    //Serial.println("Tombol telah ditekan");
    triggerButtonAlreadyPressed = true;
    //MoveUkurMaju();
    startukur==true;
  }
  else if (joystickButtonInput[3] == 1){
    triggerButtonAlreadyPressed = false;
  }
  //----------------------
}

void moveMotorByAnalog()
{
  unsigned long delayMapping = 0;
  if (joystickButtonInput[2] > ANALOG_MIDDLE_VALUE + ANALOG_Z_CORRECTION){
    digitalWrite(dirPin, HIGH);
    delayMapping = map(joystickButtonInput[2],ANALOG_MIDDLE_VALUE,ANALOG_Z_MAX,speedSlow3,speedFast);
  }
  else{
    digitalWrite(dirPin, LOW);
    delayMapping = map(joystickButtonInput[2],ANALOG_MIDDLE_VALUE,ANALOG_Z_MIN,speedSlow3,speedFast);
  } 

  //Serial.print("Nilai Inputer Motor:");
  //Serial.println(joystickButtonInput[2]);
  if (joystickButtonInput[2] > ANALOG_MIDDLE_VALUE + ANALOG_Z_CORRECTION || joystickButtonInput[2] < ANALOG_MIDDLE_VALUE - ANALOG_Z_CORRECTION){
      if (micros() - pulseDelay > delayMapping){
      
      //Serial.print("Delay Motor:");
      //Serial.print(delayMapping);
      //Serial.println("us");
      

      tooglePulse = !tooglePulse;
      if (tooglePulse){
        digitalWrite(stepPin, HIGH);
      }
      else{
        digitalWrite(stepPin, LOW);
      }
      pulseDelay = micros();
    }
  }
  else{
    digitalWrite(stepPin, LOW);
  }
 
}
