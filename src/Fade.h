#pragma once

#include "Config.h"

#include <Arduino.h>


class FastLEDHubClass;

namespace Fade
{

enum class FadeMode
{
  NONE = 0,
  ALARM,
  SUNSET
};

extern FadeMode mode;

void handle();
void begin(FadeMode fadeMode);
void stop();
void tick();
void initialize();
void getSunsetTime();
bool getTime(int8_t *hour, int8_t *minute);

} // namespace Fade
