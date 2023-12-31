import React from "react";
import { useState, useEffect, useRef } from "react";
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
import './dashboard.css'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import houseIcon from '../assets/house.svg'

function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userSongs, setSongs] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(-1)
  const [generatedImageUrls, setGeneratedImageUrls] = useState(null)
  const [generatingState, setGeneratingState] = useState('before')
  const [selectedSong, setSelectedSong] = useState('')
  const [generatingTextIndex, setGeneratingTextIndex] = useState(0)
  const [imgFinishedLoading, setImgFinishedLoading] = useState(null)

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
    const serializedSongData = userSongs[selectedPlaylist].reduce((result, item, index) => {
      if (index < 6) {
        result[item.song] = item.artist;
      }
      return result;
    }, {})
    try {
      const createUrl = 'http://127.0.0.1:8000/create?username=' + userData.display_name + '&playlist=' + userPlaylists[selectedPlaylist].name
      const response = await fetch(createUrl, {
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



  const generatingMessages = ['Fetching song lyrics...', 'Generating song descriptions...', 'Reducing song descriptions to 1 concise prompt...', 'Building a playlist art cover...', 'Saving playlist art cover to server...']
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Use the functional form of setGeneratingTextIndex to ensure you're working with the latest state value
      setGeneratingTextIndex((prevIndex) => (prevIndex + 1) % generatingMessages.length);
    }, 5000);

    return () => clearInterval(intervalId); // Cleanup the interval on unmount
  }, []);

  const pRef = useRef(null)
  useEffect(() => {
    if (pRef.current) {
      pRef.current.textContent = generatingMessages[generatingTextIndex];
    }
  }, [generatingTextIndex]);


const handleNavigationRedirect = () => {
  const newTab = window.open(`http://127.0.0.1:8000/download/${selectedSong}`, '_blank', 'noopener')
  navigate(`/created#access_token=${accessToken}&token_type=Bearer&expires_in=3600&state=123`)
}
  return (
    <div className="dashboard-container">
      <Link to={`/created#access_token=${accessToken}&token_type=Bearer&expires_in=3600&state=123`} style={{ position:'absolute', top:'50px', right:'50px' }} >
        Goto profile
      </Link>
      {generatingState === 'done' &&
        <>
          <h1 style={{ width: '100%', textAlign: 'center', fontSize: '40px', fontWeight: '600', marginBottom: '40px' }} >Your suggested covers</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '24px' }}>
            {generatedImageUrls.map((image, index) => {
              return (
                <AspectRatio className={`${selectedSong === image ? 'chosenOne' : ''} aspectRatioThing`} onClick={(e) => { if (selectedSong === image) { setSelectedSong(null) } else setSelectedSong(image) }} key={index} ratio={1}>
                  <img onLoad={(e) => setGeneratingState('done')} className="showOnGenerationImg" style={{ animationDelay: `${index / 4}s` }} src={`http://127.0.0.1:8000/image/${image}`} key={index} />
                </AspectRatio>
              )
            })}
          </div>
          {selectedSong &&
            <button onClick={(e) =>{ handleNavigationRedirect()}} style={{ backgroundColor: 'rgba(115,219,241,1)', borderRadius: '24px', padding: '16px', fontSize: '20px' }} ><p>Download playlist cover!</p></button>
          }
        </>
      }
      {userData && userPlaylists &&
        <div style={{ height: `${generatingState === 'generating' | imgFinishedLoading === true ? '0' : 'unset'}` }}>
          <h1 className={`magic-text ${generatingState === 'generating' | generatingState === 'done' && 'hideOnGeneration'}`} style={{ fontWeight: '600', fontSize: '50px' }}>Hey, {userData.display_name}</h1>
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
                  <p ref={pRef} style={{ fontSize: '20px' }}>{generatingState === 'generating' ? generatingMessages[generatingTextIndex] : 'Generation complete!'}</p>
                </div>
              ) : (
                <h1 style={{ fontSize: '24px' }}>Generate playlist cover for {userPlaylists[selectedPlaylist].name}</h1>
              )}
            </div>
          )}
        </div>
      }
      <h1 className={`${generatingState === 'generating' | generatingState === 'done' && 'hideOnGeneration'}`} style={{ fontSize: '20px', marginBottom: '12px' }}>Select one of your playlists</h1>
      {userSongs &&
        <Accordion style={{ overflow: 'hidden', height: `${generatingState === 'generating' | generatingState === 'done' ? '0' : 'unset'}` }} className={`${generatingState === 'done' && 'hideOnGeneration'}`} allowToggle index={selectedPlaylist} onChange={(e) => { setSelectedPlaylist(e) }} >
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
