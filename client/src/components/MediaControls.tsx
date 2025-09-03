import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  FastForward,
  Rewind,
  Subtitles,
  Settings,
  PictureInPicture,
  List,
  Music,
  Video,
  Radio,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  url: string;
  type: 'video' | 'audio';
  thumbnail?: string;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  source: string;
}

interface EqualizerBand {
  frequency: number;
  gain: number;
  label: string;
}

interface MediaControlsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab?: {
    url: string;
    title: string;
  };
}

export function MediaControls({ isOpen, onClose, currentTab }: MediaControlsProps) {
  const { toast } = useToast();
  const [activeMedia, setActiveMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(false);
  const [equalizerBands, setEqualizerBands] = useState<EqualizerBand[]>([
    { frequency: 60, gain: 0, label: '60Hz' },
    { frequency: 170, gain: 0, label: '170Hz' },
    { frequency: 350, gain: 0, label: '350Hz' },
    { frequency: 1000, gain: 0, label: '1kHz' },
    { frequency: 3500, gain: 0, label: '3.5kHz' },
    { frequency: 10000, gain: 0, label: '10kHz' },
  ]);
  const [equalizerPreset, setEqualizerPreset] = useState('flat');

  // Simuler deteksjon av media på siden
  useEffect(() => {
    if (isOpen) {
      // Simuler noen aktive mediaelementer
      const simulatedMedia: MediaItem[] = [
        {
          id: '1',
          title: 'Eksempelvideo',
          duration: 240,
          url: currentTab?.url || '',
          type: 'video',
          thumbnail: '/placeholder-video.jpg',
          currentTime: 0,
          isPlaying: false,
          volume: 70,
          isMuted: false,
          playbackRate: 1,
          source: 'YouTube'
        },
        {
          id: '2',
          title: 'Bakgrunnsmusikk',
          artist: 'Ukjent artist',
          duration: 180,
          url: currentTab?.url || '',
          type: 'audio',
          currentTime: 45,
          isPlaying: true,
          volume: 50,
          isMuted: false,
          playbackRate: 1,
          source: 'Spotify Web'
        }
      ];
      
      setActiveMedia(simulatedMedia);
      if (simulatedMedia.length > 0) {
        setSelectedMedia(simulatedMedia[0]);
        setIsPlaying(simulatedMedia[0].isPlaying);
        setCurrentTime(simulatedMedia[0].currentTime);
        setDuration(simulatedMedia[0].duration);
        setVolume(simulatedMedia[0].volume);
      }
    }
  }, [isOpen, currentTab]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (selectedMedia) {
      toast({
        title: isPlaying ? 'Satt på pause' : 'Spiller av',
        description: selectedMedia.title,
      });
    }
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handlePlaybackRateChange = (rate: string) => {
    const newRate = parseFloat(rate);
    setPlaybackRate(newRate);
    toast({
      title: 'Avspillingshastighet endret',
      description: `${newRate}x hastighet`,
    });
  };

  const handlePictureInPicture = () => {
    setIsPictureInPicture(!isPictureInPicture);
    toast({
      title: isPictureInPicture ? 'Bilde-i-bilde avsluttet' : 'Bilde-i-bilde aktivert',
      description: 'Videoen spilles av i et flytende vindu',
    });
  };

  const handleEqualizerBandChange = (index: number, value: number[]) => {
    const newBands = [...equalizerBands];
    newBands[index].gain = value[0];
    setEqualizerBands(newBands);
  };

  const applyEqualizerPreset = (preset: string) => {
    setEqualizerPreset(preset);
    let newBands = [...equalizerBands];
    
    switch (preset) {
      case 'flat':
        newBands = newBands.map(band => ({ ...band, gain: 0 }));
        break;
      case 'bass':
        newBands[0].gain = 6;
        newBands[1].gain = 4;
        newBands[2].gain = 2;
        break;
      case 'treble':
        newBands[3].gain = 2;
        newBands[4].gain = 4;
        newBands[5].gain = 6;
        break;
      case 'vocal':
        newBands[2].gain = -2;
        newBands[3].gain = 4;
        newBands[4].gain = 2;
        break;
    }
    
    setEqualizerBands(newBands);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4" />;
    if (volume < 50) return <Volume1 className="w-4 h-4" />;
    return <Volume2 className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            Mediakontroller
          </DialogTitle>
          <DialogDescription>
            Kontroller all lyd og video på denne siden
          </DialogDescription>
        </DialogHeader>

        {activeMedia.length === 0 ? (
          <Card className="p-8 text-center">
            <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Ingen aktive medieelementer funnet på denne siden
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="player" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="player">
                <Play className="w-4 h-4 mr-2" />
                Spiller
              </TabsTrigger>
              <TabsTrigger value="queue">
                <List className="w-4 h-4 mr-2" />
                Kø
              </TabsTrigger>
              <TabsTrigger value="equalizer">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Equalizer
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Innstillinger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="player" className="space-y-4">
              {selectedMedia && (
                <>
                  {/* Media Info */}
                  <Card className="p-4">
                    <div className="flex items-start gap-4">
                      {selectedMedia.type === 'video' ? (
                        <div className="w-32 h-20 bg-muted rounded flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                          <Music className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{selectedMedia.title}</h3>
                        {selectedMedia.artist && (
                          <p className="text-sm text-muted-foreground">{selectedMedia.artist}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{selectedMedia.type}</Badge>
                          <Badge variant="secondary">{selectedMedia.source}</Badge>
                        </div>
                      </div>
                      {selectedMedia.type === 'video' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePictureInPicture}
                                className={isPictureInPicture ? 'bg-primary text-primary-foreground' : ''}
                              >
                                <PictureInPicture className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Bilde-i-bilde</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </Card>

                  {/* Progress Bar */}
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <Slider
                        value={[currentTime]}
                        max={duration}
                        step={1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                      />
                    </div>
                  </Card>

                  {/* Playback Controls */}
                  <Card className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                      >
                        <Rewind className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={handlePlayPause}
                        className="w-12 h-12"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentTime(Math.min(duration, currentTime + 5))}
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                      >
                        <FastForward className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Volume and Speed Controls */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleMuteToggle}
                        >
                          {getVolumeIcon()}
                        </Button>
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          max={100}
                          step={1}
                          onValueChange={handleVolumeChange}
                          className="flex-1 max-w-[150px]"
                        />
                        <span className="text-xs w-8">{isMuted ? 0 : volume}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Hastighet:</Label>
                        <Select
                          value={playbackRate.toString()}
                          onValueChange={handlePlaybackRateChange}
                        >
                          <SelectTrigger className="w-[80px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.25">0.25x</SelectItem>
                            <SelectItem value="0.5">0.5x</SelectItem>
                            <SelectItem value="0.75">0.75x</SelectItem>
                            <SelectItem value="1">1x</SelectItem>
                            <SelectItem value="1.25">1.25x</SelectItem>
                            <SelectItem value="1.5">1.5x</SelectItem>
                            <SelectItem value="1.75">1.75x</SelectItem>
                            <SelectItem value="2">2x</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedMedia.type === 'video' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSubtitles(!showSubtitles)}
                          className={showSubtitles ? 'bg-primary text-primary-foreground' : ''}
                        >
                          <Subtitles className="w-4 h-4 mr-2" />
                          Teksting
                        </Button>
                      )}
                    </div>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="queue" className="space-y-4">
              <Card className="p-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {activeMedia.map((media, idx) => (
                      <Card
                        key={media.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedMedia?.id === media.id ? 'bg-accent' : 'hover:bg-accent/50'
                        }`}
                        onClick={() => {
                          setSelectedMedia(media);
                          setIsPlaying(media.isPlaying);
                          setCurrentTime(media.currentTime);
                          setDuration(media.duration);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            {media.type === 'video' ? (
                              <Video className="w-5 h-5" />
                            ) : (
                              <Music className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{media.title}</span>
                              {media.isPlaying && (
                                <Badge variant="secondary" className="text-xs">
                                  Spiller
                                </Badge>
                              )}
                            </div>
                            {media.artist && (
                              <p className="text-xs text-muted-foreground">{media.artist}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(media.currentTime)} / {formatTime(media.duration)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {media.source}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="equalizer" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Forhåndsinnstilling</Label>
                    <Select value={equalizerPreset} onValueChange={applyEqualizerPreset}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="bass">Bass boost</SelectItem>
                        <SelectItem value="treble">Diskant boost</SelectItem>
                        <SelectItem value="vocal">Vokal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-6 gap-4">
                    {equalizerBands.map((band, idx) => (
                      <div key={idx} className="text-center">
                        <Label className="text-xs">{band.label}</Label>
                        <div className="h-32 flex justify-center mt-2">
                          <Slider
                            orientation="vertical"
                            value={[band.gain]}
                            min={-12}
                            max={12}
                            step={1}
                            onValueChange={(value) => handleEqualizerBandChange(idx, value)}
                            className="h-full"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {band.gain > 0 ? '+' : ''}{band.gain}dB
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => applyEqualizerPreset('flat')}
                    className="w-full"
                  >
                    Tilbakestill
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  {selectedMedia?.type === 'video' && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="quality">Videokvalitet</Label>
                        <p className="text-xs text-muted-foreground">
                          Velg avspillingskvalitet
                        </p>
                      </div>
                      <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2160p">4K (2160p)</SelectItem>
                          <SelectItem value="1440p">2K (1440p)</SelectItem>
                          <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                          <SelectItem value="720p">HD (720p)</SelectItem>
                          <SelectItem value="480p">SD (480p)</SelectItem>
                          <SelectItem value="360p">Lav (360p)</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoplay">Automatisk avspilling</Label>
                      <p className="text-xs text-muted-foreground">
                        Spill av neste element automatisk
                      </p>
                    </div>
                    <Switch
                      id="autoplay"
                      checked={autoplay}
                      onCheckedChange={setAutoplay}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="loop">Gjenta</Label>
                      <p className="text-xs text-muted-foreground">
                        Gjenta gjeldende element
                      </p>
                    </div>
                    <Switch
                      id="loop"
                      checked={loop}
                      onCheckedChange={setLoop}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lydutgang</Label>
                      <p className="text-xs text-muted-foreground">
                        Velg lydutgangsenhet
                      </p>
                    </div>
                    <Select defaultValue="default">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          <div className="flex items-center gap-2">
                            <Speaker className="w-4 h-4" />
                            Systemstandard
                          </div>
                        </SelectItem>
                        <SelectItem value="headphones">
                          <div className="flex items-center gap-2">
                            <Headphones className="w-4 h-4" />
                            Hodetelefoner
                          </div>
                        </SelectItem>
                        <SelectItem value="bluetooth">
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4" />
                            Bluetooth-enhet
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mikrofoninngang</Label>
                      <p className="text-xs text-muted-foreground">
                        For stemmekommandoer
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Mic className="w-4 h-4 mr-2" />
                      Konfigurer
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}