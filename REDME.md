# Generar clave de firmado para play store 

```
& "C:\Program Files\Java\jdk-21\bin\keytool.exe" -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```