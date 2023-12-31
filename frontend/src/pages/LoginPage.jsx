import React, { useState, useEffect, useRef } from 'react'
import './loginPage.css' 
import { Button } from '@chakra-ui/react'
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from 'react-icons/fa';
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { HashLink as Link } from 'react-router-hash-link';
import axios from "axios";

function LoginPage() {  

  const [image, setImage] = useState(null)
  const ref = useRef(null)
  const handleClick = () => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const [current, setCurrent] = useState(0);
  const [length, setLength] = useState(0);

  const nextSlide = () => {
    setCurrent(current === length - 1 ? 0 : current + 1);
  };

  const prevSlide = () => {
    setCurrent(current === 0 ? length - 1 : current - 1);
  };

  const CLIENT_ID = '86a9b174064c4972bdf1fdb949b81050';
  const REDIRECT_URI = 'http://127.0.0.1:5173/dashboard';
  

  // Spotify authorization URL
  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user-library-read&response_type=token&state=123`;

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/featured/').then((results) => {
      const data = results.data
      setImage(data)
      setLength(data.length)
      console.log(data)
    })
  }, []);

  return (
    <>
      <div className="overall-container">
        <div className="login-container">
          <div className="intro-container" id="intro-type" style={{ height:'100dvh',display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent:"center"}}>
            <h1 className="introduction"> Welcome to the Cover Page </h1>
            <p classname="intro2"> Log in With Spotify Below to Get Started, or See Our Featured Covers </p>
            <div className='spotify-button'>
              <a href={spotifyAuthUrl}>
                  <Button className='magic-bg' id="login-button" style={{ backgroundColor: 'rgb(143, 183, 244)', color: 'white', margin:"30px"}} variant='outline'>
                    Connect your Spotify
                  </Button>
              </a>
              <Button onClick={handleClick} className='magic-bg' id="login-button" style={{ backgroundColor: 'rgb(143, 183, 244)', color: 'white', margin:"30px"}} variant='outline'>
                See Featured Covers 
              </Button>
            </div>    
          </div>  
          <h1 className="feature" ref={ref}>Featured Covers!</h1>  
          <section className='slider'>
              <FaArrowAltCircleLeft className='left-arrow' onClick={prevSlide} color="pink"/>
              <FaArrowAltCircleRight className='right-arrow' onClick={nextSlide} color="pink"/>
              {image && image.map((slide, index) => {
                const slide_url = "http://127.0.0.1:8000/image/" + slide
                return (
                  <div
                    className={index === current ? 'slide active' : 'slide'}
                    key={index}
                  >
                    {index === current && (
                      <img src={slide_url} alt='travel image' className='image' />
                    )}
                  </div>
                );
              })}
            </section> 
        </div>
       
      </div>
    </>
  )
}

export default LoginPage