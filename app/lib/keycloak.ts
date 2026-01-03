import Keycloak from "keycloak-js";
import { appConfig } from "./appConfig";

let keycloak: Keycloak | null = null;

export function getKeycloak() {
  if (keycloak) return keycloak;

  keycloak = new Keycloak({
    url: appConfig.keycloak.url,
    realm: appConfig.keycloak.realm,
    clientId: appConfig.keycloak.clientId,
  });

  return keycloak;
}
