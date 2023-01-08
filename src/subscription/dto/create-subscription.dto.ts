export class CreateSubscriptionDto {}

export class CreateCollectionSchema {
  name: string;
  usd?: string;
  currency: string;
  floorPrice?: string;
  floorToken?: string;
  address: string;
}
