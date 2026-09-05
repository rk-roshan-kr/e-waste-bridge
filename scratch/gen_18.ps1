
Add-Type -AssemblyName System.Speech
 = New-Object System.Speech.Synthesis.SpeechSynthesizer
.SetOutputToWaveFile('scratch/test_18kg.wav')
.Speak('18 kg')
.Dispose()
