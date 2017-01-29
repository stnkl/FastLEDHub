#include "nox.h"

Effect nox = {
	"Nox",
	noxNamespace::tick,		// tick
	noxNamespace::reset,	// reset
	25,						// intervalZeroOffset
	0						// intervalStepSize
};

namespace noxNamespace
{
	
	void reset()
	{
		FastLED.clear();
		FastLED.show();
	}

	void tick()
	{
		FastLED.clear();
		//FastLED.show();
	}

}