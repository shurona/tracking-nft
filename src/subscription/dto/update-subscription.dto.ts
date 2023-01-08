import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriptionDto } from './create-subscription.dto';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {}

export class FloorPriceUpdate {
  name: string;
  usd: string;
  currency: string;
  floorPrice: string;
  floorToken: string;
}
