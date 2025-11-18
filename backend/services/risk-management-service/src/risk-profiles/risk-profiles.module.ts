import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RiskProfile, RiskProfileSchema } from '../database/schemas/risk-profile.schema';
import { RiskAlert, RiskAlertSchema } from '../database/schemas/risk-alert.schema';
import { RiskProfilesService } from './risk-profiles.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RiskProfile.name, schema: RiskProfileSchema },
      { name: RiskAlert.name, schema: RiskAlertSchema },
    ]),
  ],
  providers: [RiskProfilesService],
  exports: [RiskProfilesService],
})
export class RiskProfilesModule {}
