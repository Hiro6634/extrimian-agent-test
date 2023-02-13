import { Agent, 
    AgentModenaUniversalRegistry, 
    AgentModenaUniversalResolver, 
    CredentialFlow, 
    DWNTransport, 
    FileSystemAgentSecureStorage, 
    FileSystemStorage, 
    VerifiableCredential, 
    WACICredentialOfferSucceded, 
    WACIProtocol } from "@extrimian/agent";

const index = async () => {
    const waciProtocol = new WACIProtocol({
        issuer: {
            issuerCredentialToSend: async (waciInvitationId: string, holderId: string) => {
                return new WACICredentialOfferSucceded({
                    credentials: [{
                        credential: {
                            "@context": [
                                "https://www.w3.org/2018/credentials/v1",
                                "https://www.w3.org/2018/credentials/examples/v1",
                                "https://w3id.org/security/bbs/v1"
                            ],
                            id: "http://example.edu/credentials/58473",
                            type: [
                                "VerifiableCredential",
                                "AlumniCredential"
                            ],
                            issuer: "did:quarkid:matic:EiDs1liYifwFEg9l7rxrpR48MH-7Z-M2E32R1vEYThQWsQ",
                            issuanceDate: new Date(),
                            credentialSubject: {
                                id: "did:quarkid:matic:EiCG4tEWdX08DuGKM6rX-fUfHxmJ_N6SY8XqTI8QHfBgtQ",
                                givenName: "Jhon",
                                familyName: "Does"
                            }
                        },
                        outputDescriptor: {
                            id: "alumni_credential_output",
                            schema: "https://schema.org/EducationalOccupationalCredential",
                            display: {
                                title: {
                                    path: [
                                        "$.name",
                                        "$.vc.name"
                                    ],
                                    fallback: "Alumni Credential"
                                },
                                subtitle: {
                                    path: [
                                        "$.class",
                                        "$.vc.class"
                                    ],
                                    fallback: "Alumni"
                                },
                                description: {
                                    "text": "Credencial que permite validar que es alumno del establecimiento"
                                },
                            },
                            styles: {
                                background: {
                                    color: "#ff0000"
                                },
                                thumbnail: {
                                    uri: "https://dol.wa.com/logo.png",
                                    alt: "Universidad Nacional"
                                },
                                hero: {
                                    uri: "https://dol.wa.com/alumnos.png",
                                    alt: "Alumnos de la universidad"
                                },
                                text: {
                                    color: "#d4d400"
                                }
                            }
                        }
                    }],
                    issuer: {
                        name: "Universidad Nacional",
                        styles: {
                            thumbnail: {
                                uri: "https://dol.wa.com/logo.png",
                                alt: "Universidad Nacional"
                            },
                            hero: {
                                uri: "https://dol.wa.com/alumnos.png",
                                alt: "Alumnos de la universidad"
                            },
                            background: {
                                color: "#ff0000"
                            },
                            text: {
                                color: "#d4d400"
                            }
                        }
                    },
                    options: {
                        challenge: "508adef4-b8e0-4edf-a53d-a260371c1423",
                        domain: "9rf25a28rs96"
                    },
                });
            }
        },
        verifier: {
            presentationRequest: async (invitationId: string) => {
                return {
                    frame: {
                        "@context": [
                            "https://www.w3.org/2018/credentials/v1",
                            "https://www.w3.org/2018/credentials/examples/v1",
                            "https://w3id.org/security/bbs/v1"
                        ],
                        "type": [
                            "VerifiableCredential",
                            "AlumniCredential"
                        ],
                        "credentialSubject": {
                            "@explicit": true,
                            "type": [
                                "AlumniCredential"
                            ],
                            "givenName": {},
                            "familyName": {}
                        }
                    },
                    inputDescriptors: [
                        {
                            id: "Alumni Credential",
                            name: "AlumniCredential",
                            constraints: {
                                fields: [
                                    {
                                        path: [
                                            "$.credentialSubject.givenName"
                                        ],
                                        filter: {
                                            type: "string"
                                        }
                                    },
                                    {
                                        path: [
                                            "$.credentialSubject.familyName"
                                        ],
                                        filter: {
                                            type: "string"
                                        }
                                    }
                                ]
                            }
                        }
                    ],
                }
            }
        }
    });

    const issuerAgent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry("http://modena.gcba-extrimian.com:8080"),
        didDocumentResolver: new AgentModenaUniversalResolver("http://modena.gcba-extrimian.com:8080"),
        agentStorage: new FileSystemStorage({
            filepath: "./src/data/agent-issuer-storage.json"
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: "./src/data/agent-issuer-secure-storage.json"
        }),
        vcProtocols: [waciProtocol],
        supportedTransports: [new DWNTransport()]
    });
    await issuerAgent.initialize();

    issuerAgent.vc.credentialIssued.on((args) => {
        console.log(args);
    });

    const holderWaciProtocol = new WACIProtocol({
        holder: {
            selectVcToPresent: async (vcs: VerifiableCredential[]) => {
                return vcs;
            }
        },
    });


    const holderAgent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry("http://modena.gcba-extrimian.com:8080"),
        didDocumentResolver: new AgentModenaUniversalResolver("http://modena.gcba-extrimian.com:8080"),
        agentStorage: new FileSystemStorage({
            filepath: "./src/data/agent-holder-storage.json"
        }),
        secureStorage: new FileSystemAgentSecureStorage({
            filepath: "./src/data/agent-holder-secure-storage.json"
        }),
        vcStorage: new FileSystemStorage({
            filepath: "./src/data/agent-holder-vc-storage.json",
        }),
        vcProtocols: [holderWaciProtocol],
        supportedTransports: [new DWNTransport()]
    });

    await holderAgent.initialize();

    const processMessage = async () => new Promise(async (resolve, reject) => {

        const wait = async () => new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, 20000);
        });

        await wait();


        holderAgent.vc.credentialArrived.on(async (vc) => {
            await holderAgent.vc.saveCredential(vc!);

            const result = await holderAgent.vc.verifyVC({
                vc: vc!
            });

            console.log("credentialArrived", vc);

            resolve(null);
        });

        await holderAgent.vc.processMessage({
            message: await issuerAgent.vc.createInvitationMessage({ flow: CredentialFlow.Issuance }),
        });
    });

    await processMessage();
}

index();