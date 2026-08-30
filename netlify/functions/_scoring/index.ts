import type { CampaignJson, ScoreFlag, ScoreResult } from './types';
import {
  scoreHousing,
  scoreCreative,
  scoreDestination,
  scoreTracking,
  scoreAlgorithm,
} from './rules';

const WEIGHTS = {
  housing: 0.3,
  creative: 0.2,
  destination: 0.15,
  tracking: 0.2,
  algorithm: 0.15,
};

export function scoreCampaignJson(campaign: CampaignJson): ScoreResult {
  const flags: ScoreFlag[] = [];

  const housingScore = scoreHousing(campaign, flags);
  const creativeScore = scoreCreative(campaign, flags);
  const destinationScore = scoreDestination(campaign, flags);
  const trackingScore = scoreTracking(campaign, flags);
  const algorithmScore = scoreAlgorithm(campaign, flags);

  const totalScore = Math.round(
    housingScore * WEIGHTS.housing +
      creativeScore * WEIGHTS.creative +
      destinationScore * WEIGHTS.destination +
      trackingScore * WEIGHTS.tracking +
      algorithmScore * WEIGHTS.algorithm
  );

  return {
    totalScore,
    housingScore,
    creativeScore,
    destinationScore,
    trackingScore,
    algorithmScore,
    flags,
  };
}

export type { CampaignJson, ScoreResult, ScoreFlag };
