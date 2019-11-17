# Encryption of chat messages

All sent chat messages are encrypted with AES256 GCM where the key is derived via X25519 key exchange. The main goal here is to protect the already sent messages, that may contain phones numbers and various PII, when the server database gets hacked. But don't take this protection too seriously because there are other ways to hack this system:

- Take control over the app itself and push an update that leaks the private keys. This allows to get a dump of all the user data and see all past and future messages.
- Hack the server and swap the public key of the recipient of your next message. This allows the attacker to see your message, although the recipient won't be able to decrypt it, as the keys won't match anymore.
- Use some deficiency in this protocol. This app doesn't use libsignal/libgcrypt and instead rolls its own AES/X25519 based protocol. 

The takeaway is that this encryption is only good enough to protect low value data from naive hackers. It's a good idea to use this app to exchange with phone numbers or emails, delete the chat and continue the conversation over more secure channels.
