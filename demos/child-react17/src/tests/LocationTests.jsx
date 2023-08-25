import React from 'react';
import { Link } from 'react-router-dom';
import LocationInfo from '../components/LocationInfo';


document.addEventListener('touchmove', (e) => {
    console.log('touchmove', e);
});
export default function LocationTests() {
    return (
        <div>
            <h1>Location Tests</h1>
            <h2>location basic info</h2>
            <div id="location-info">
                <LocationInfo />
            </div>

            <h2>no refresh hash redirect</h2>
            <button
                id="btn-location"
                onClick={() => {
                    window.location.href = '#/location';
                }}
            >
                redirect by window.location.href
            </button>
            <a id="a-tag-location" href="#/location">
                redirect by a tag
            </a>
            <Link id="link-location" to="/location">
                redirect by Link
            </Link>
            <h2>no refresh historyApi</h2>

            <h2>refresh and redirect</h2>
        </div>
    );
}
