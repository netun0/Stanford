function erb = khz2erb(khz)% KHZ2ERB - convert frequency in kHz to critical-band rate in ERB.%% ERB = khz2erb(KHZ) returns a matrix of frequencies ERB measured in% equivalent rectangular bandwidth computed from frequencies KHZ measured% in kHz using the formula%%        ERB = 21.4*log10(4.37*KHZ + 1.0).%% See also KHZ2BARK, BARK2KHZ, KHZ2CBW.% Reference:% [1] B.�C.�J. Moore and B.�R. Glasberg, "A revision of Zwicker's loudness% model," ACTA Acustica, vol.�82, pp.�335-345, 1996. % (c) Copyright 1994 Abel Innovations.  All rights reserved.%% Jonathan S. Abel% Created: 19-May-2004% Version: 1.0%% verify inputs%%if (nargin < 1),	disp('bark2khz: ERROR - No input arguments supplied.');	return;else,	khz = abs(khz);end;%% compute frequencies%%erb = 21.4*log10(4.37*khz + 1.0);