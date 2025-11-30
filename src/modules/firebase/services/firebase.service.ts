import { Inject, Injectable } from "@nestjs/common";
import { FIREBASE_AUTH } from "../firebase.constants";
import { Auth } from "firebase-admin/auth";

@Injectable()
export class FirebaseService {
  constructor(
    @Inject(FIREBASE_AUTH)
    private readonly auth: Auth,
  ) {}

  /**
   * Formats company name to meet Firebase tenant displayName requirements:
   * - Must start with a letter
   * - Only letters, digits, and hyphens
   * - 4-20 characters
   * Uses the same slug generation logic as tenant management
   */
  private formatFirebaseDisplayName(companyName: string): string {
    // Use same slug generation as tenant management
    let formatted = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars except spaces and hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

    // Ensure it starts with a letter
    if (!/^[a-z]/.test(formatted)) {
      formatted = "tenant-" + formatted;
    }

    // Ensure length is between 4-20 characters
    if (formatted.length < 4) {
      formatted = formatted.padEnd(4, "x");
    }
    if (formatted.length > 20) {
      formatted = formatted.substring(0, 20);
    }

    // Final check: ensure it ends with alphanumeric (not hyphen)
    formatted = formatted.replace(/-+$/, "");
    if (formatted.length < 4) {
      formatted = formatted.padEnd(4, "x");
    }

    return formatted;
  }

  createTenant(companyName: string) {
    // Step 2: Create Firebase tenant with formatted display name
    const firebaseDisplayName = this.formatFirebaseDisplayName(companyName);

    return this.auth.tenantManager().createTenant({
      displayName: firebaseDisplayName,
      emailSignInConfig: {
        enabled: true,
        passwordRequired: true,
      },
      multiFactorConfig: {
        state: "DISABLED",
      },
    });
  }

  /**
   * Create a Firebase user within a specific tenant
   */
  async createTenantUser(
    firebaseTenantId: string,
    email: string,
    password: string,
    displayName: string,
  ) {
    return this.auth
      .tenantManager()
      .authForTenant(firebaseTenantId)
      .createUser({
        email,
        password,
        displayName,
      });
  }

  /**
   * Set custom claims for a Firebase user within a specific tenant
   */
  async setTenantUserClaims(
    firebaseTenantId: string,
    firebaseUid: string,
    customClaims: Record<string, any>,
  ) {
    return this.auth
      .tenantManager()
      .authForTenant(firebaseTenantId)
      .setCustomUserClaims(firebaseUid, customClaims);
  }

  /**
   * Create a custom token for a Firebase user within a specific tenant
   */
  async createTenantCustomToken(
    firebaseTenantId: string,
    firebaseUid: string,
    additionalClaims?: Record<string, any>,
  ) {
    return this.auth
      .tenantManager()
      .authForTenant(firebaseTenantId)
      .createCustomToken(firebaseUid, additionalClaims);
  }

  /**
   * Get the tenant-specific auth instance
   */
  getTenantAuth(firebaseTenantId: string) {
    return this.auth.tenantManager().authForTenant(firebaseTenantId);
  }
}
