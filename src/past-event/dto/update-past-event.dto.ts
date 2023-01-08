import { PartialType } from '@nestjs/mapped-types';
import { CreatePastEventDto } from './create-past-event.dto';

export class UpdatePastEventDto extends PartialType(CreatePastEventDto) {}
