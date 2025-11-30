import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { FIREBASE_ADMIN, FIREBASE_AUTH } from "./firebase.constants";
import { FirebaseService } from "./services/firebase.service";

@Module({
  providers: [
    {
      provide: FIREBASE_ADMIN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const projectId = config.get<string>("FIREBASE_PROJECT_ID");
        const clientEmail = config.get<string>("FIREBASE_CLIENT_EMAIL");
        const privateKey = config
          .get<string>("FIREBASE_PRIVATE_KEY")
          ?.replace(/\\n/g, "\n");

        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        }
        return admin.app();
      },
    },
    {
      provide: FIREBASE_AUTH,
      inject: [FIREBASE_ADMIN],
      useFactory: (app: admin.app.App) => {
        return app.auth();
      },
    },
    FirebaseService,
  ],
  exports: [FIREBASE_ADMIN, FIREBASE_AUTH, FirebaseService],
})
export class FirebaseModule {}
