declare module 'moyasar' {
  export type MoyasarEvent = {
    type: string;
    data: any;
  };

  export class Webhook {
    constructor(rawBody: string, signature: string | null, secret?: string);
    verify(): boolean;
    readonly event: MoyasarEvent;
  }
}
