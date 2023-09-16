import React from "react";
import { useState, useEffect } from "react";
import { Button, ButtonGroup, Slider } from "@chakra-ui/react";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Box,
  AccordionIcon,
  AspectRatio,
  CircularProgress
} from "@chakra-ui/react";
import axios from "axios";

function Dashboard() {
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userSongs, setSongs] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(-1)
  const [generatedImageUrls, setGeneratedImageUrls] = useState(null)
  const [generatingState, setGeneratingState] = useState('before')
  const [selectedSong, setSelectdSong] = useState('')

  // get accesstoken from the url
  useEffect(() => {
    const getAccessTokenFromURL = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      if (params.has("access_token")) {
        const token = params.get("access_token");
        setAccessToken(token);
      }
    };
    getAccessTokenFromURL();
  }, []);

  // Get user Data and user playlist names
  useEffect(() => {
    if (accessToken) {
      const getUserData = axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const getUserPlaylists = axios.get(
        "https://api.spotify.com/v1/me/playlists",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      Promise.all([getUserData, getUserPlaylists])
        .then(([userDataResponse, playlistsResponse]) => {
          setUserData(userDataResponse.data);
          setUserPlaylists(playlistsResponse.data.items);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }
  }, [accessToken]);

  // get song name and artist for each song from each playlist
  useEffect(() => {
    if (accessToken && userPlaylists) {
      const playlistPromises = userPlaylists.map((playlist) =>
        axios.get(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
      );
      Promise.all(playlistPromises)
        .then((playlistResponses) => {
          const songsByPlaylist = playlistResponses.map((playlistResponse) =>
            playlistResponse.data.items.map((track) => ({
              artist: track.track.artists[0].name,
              song: track.track.name,
              img: track.track.album.images[0].url,
            }))
          );

          setSongs(songsByPlaylist);
        })
        .catch((error) => {
          console.error("Error fetching playlist songs:", error);
        });
    }
  }, [accessToken, userPlaylists]);

  // serialize the song and artist data for image generation api
  const generateImage = async () => {
    setGeneratingState('generating')
    const serializedSongData = userSongs[0].reduce((result, item, index) => {
      if (index < 6) {
        result[item.song] = item.artist;
      }
      return result;
    }, {})
    try {
      const response = await fetch('http://127.0.0.1:8000/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serializedSongData)
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      const imageIds = await response.json()
      setGeneratedImageUrls(imageIds)

      setGeneratingState('done')
    } catch (error) {
      console.error(error)
    }
  }

  // const generateImage = async () => {
  //   setGeneratingState('generating')

  //   const imageIds = ['https://i.scdn.co/image/ab67616d0000b273560c2d8b7fb5524a0ad7455e', 'https://i.scdn.co/image/ab67616d0000b273560c2d8b7fb5524a0ad7455e', 'https://i.scdn.co/image/ab67616d0000b27314823906ae5ad5cd8ddf41b8', 'https://i.scdn.co/image/ab67616d0000b2737b402d293c9328219d3d34ca']
  //   setGeneratedImageUrls(imageIds)
  //   await new Promise(resolve => setTimeout(resolve, 2000))
  //   setGeneratingState('done')
  // }

  return (
    <div style={{ padding: '50px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
      {generatingState === 'done' &&
        <>
          <h1 style={{ width: '100%', textAlign: 'center', fontSize: '40px', fontWeight: '600', marginBottom: '40px' }} >Your suggested covers</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {generatedImageUrls.map((image, index) => {
              return (
                <AspectRatio key={index} ratio={1}>
                  <img className="showOnGenerationImg" style={{ animationDelay: `${index / 4}s` }} src={image} key={index} />
                </AspectRatio>
              )
            })}
          </div>
        </>
      }
      {userData && userPlaylists &&
        <div>
          <h1 className={`magic-text ${generatingState === 'done' && 'hideOnGeneration'}`} style={{ fontWeight: '600', fontSize: '50px' }}>Hey, {userData.display_name}</h1>
          {selectedPlaylist !== -1 && (
            <div
              onClick={(e) => generateImage()}
              className='magic-bg generatingButton'
              style={{
                cursor: `${generatingState === 'generating' ? 'default' : 'pointer'}`,
                position: 'fixed',
                width: '100%',
                bottom: '0',
                marginLeft: '-50px',
                zIndex: '99',
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                height: `${generatingState === 'generating' ? '100dvh' : generatingState === 'done' ? '0' : '100px'}`
              }}
            >
              {generatingState === 'generating' | generatingState === 'done' ? (
                <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: '8px' }}>
                  {generatingState === 'generating' && <CircularProgress size='40px' isIndeterminate />}
                  <p style={{ fontSize: '20px' }}>{generatingState === 'generating' ? 'Generating image...' : 'Generation complete!'}</p>
                </div>
              ) : (
                <h1 style={{ fontSize: '24px' }}>Generate playlist cover for {userPlaylists[selectedPlaylist].name}</h1>
              )}
            </div>
          )}
        </div>
      }
      <h1 className={`${generatingState === 'done' && 'hideOnGeneration'}`} style={{ fontSize: '20px', marginBottom: '12px' }}>Select one of your playlists</h1>
      {userSongs &&
        <Accordion className={`${generatingState === 'done' && 'hideOnGeneration'}`} allowToggle index={selectedPlaylist} onChange={(e) => { setSelectedPlaylist(e) }} >
          {userSongs.map((playlist, index) => (
            <AccordionItem key={index}>
              <h2>
                <AccordionButton className={selectedPlaylist === index ? 'magic-bg' : ''} style={{ display: 'flex', gap: '4px' }}>
                  <Box>
                    <h1 style={{ fontSize: '24px' }}>{userPlaylists[index].name}</h1>
                  </Box>
                  <AccordionIcon style={{ height: '24px', width: '24px' }} />
                </AccordionButton>
              </h2>
              <AccordionPanel style={{ boxShadow: 'inset 0 0 20px 0 rgb(0 0 0 / 0.1)', gap: '8px', display: 'grid', gridTemplateColumns: `repeat(3, 1fr)` }}>
                {playlist.slice(0, 9).map((song, songIndex) => (
                  <li key={songIndex} style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                    <h1 style={{ maxHeight: '32px', overflow: 'hidden', fontSize: '20px' }}>{song.song}</h1>
                    <h1>By {song.artist}</h1>
                    <AspectRatio ratio={1}>
                      <img style={{ borderRadius: '8px' }} src={song.img} />
                    </AspectRatio>
                  </li>
                ))}
              </AccordionPanel>
            </AccordionItem>
          ))
          } </Accordion>}
    </div>
  );
}

export default Dashboard;
