import { Injectable } from '@nestjs/common';
import { RtpCodecCapability } from 'mediasoup/node/lib/rtpParametersTypes';

@Injectable()
export class SfuConfigService {




    mediaCodecs: RtpCodecCapability[] = [
        // Prioritize VP8 for maximum compatibility and quality
        {
            kind: 'video',
            mimeType: 'video/VP8',
            clockRate: 90000,
            parameters: {
                'x-google-start-bitrate': 10000,  // 10 Mbps start bitrate
                'x-google-max-bitrate': 20000,    // 20 Mbps max bitrate
                'x-google-min-bitrate': 5000      // 5 Mbps minimum for quality
            }
        },
        // Keep other codecs as fallbacks
        {
            kind: 'video',
            mimeType: 'video/VP9',
            clockRate: 90000,
            parameters: {
                'profile-id': 2,
                'x-google-start-bitrate': 8000,
                'x-google-max-bitrate': 15000
            }
        },
        {
            kind: 'video',
            mimeType: 'video/h264',
            clockRate: 90000,
            parameters: {
                'packetization-mode': 1,
                'profile-level-id': '640032',     // High profile, level 5.0 for ultra HD
                'level-asymmetry-allowed': 1,
                'x-google-start-bitrate': 8000,   // 8 Mbps (doubled+)
                'x-google-max-bitrate': 15000,    // 15 Mbps max
                'x-google-min-bitrate': 2000      // 2 Mbps minimum
            }
        },
        {
            kind: 'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2
        }

    ];

    // listenIps: [{ ip: '127.0.0.1', announcedIp: null }],
    private transportOptions: any = {
        listenIps: [],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,

        // maxIncomingBitrate: 200000000, // 20 Mbps - doubled for ultra-high quality
        initialAvailableOutgoingBitrate: 100000000, // 10 Mbps - doubled for ultra-high quality
        minimumAvailableOutgoingBitrate: 25000000,  // 2.5 Mbps minimum
        // Not using SCTP for data channels since we don't need them
        enableSctp: false
    }
    maxIncomingBitrate = 200000000; // 20 Mbps - doubled for ultra-high quality
    minimumAvailableOutgoingBitrate = 25000000; // 2 Mbps - doubled minimum
    maxOutgoingBitrate = 35000000; // 20 Mbps - doubled for ultra-high quality

    transportProducerOptions = {
        enableSsrc: true,

        // Single high-quality layer for screen sharing
        encodings: [
            {
                maxBitrate: 15000000,     // 15 Mbps for higher quality
                scaleResolutionDownBy: 1.0, // Full resolution
                adaptivePtime: false,      // Disable adaptive ptime
                priority: 'high'           // High priority for this stream
            }
        ]
    }


    getTransportOptions(host: string): any {

        const env = process.env.ENVIORNMENT || 'legal';
        let listenIp = { ip: '127.0.0.1', announcedIp: null };
        if (env == 'localdocker') {
            listenIp = { ip: '0.0.0.0', announcedIp: '127.0.0.1' };
        } else if (env == 'legal') {
            listenIp = { ip: '0.0.0.0', announcedIp: '45.77.47.235' };
        } else if (env == 'tech') {
            listenIp = { ip: '0.0.0.0', announcedIp: '68.183.90.247' };
        } else if (env == 'com') {
            listenIp = { ip: '0.0.0.0', announcedIp: '139.180.153.126' };
        }
        this.transportOptions.listenIps[0] = listenIp;

        if (env == 'localdocker') {
            this.transportOptions.listenIps[0].announcedIp = host == 'localhost' ? '127.0.0.1' : host;
            this.transportOptions.listenIps[0].ip = '0.0.0.0';
        }
        console.log('Transport Options:', this.transportOptions);
        return this.transportOptions;
    }
}
