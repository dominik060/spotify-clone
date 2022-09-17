import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";

function App() {
    // console.log(process.env.REACT_APP_CLIENT_ID)
    const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
    const REDIRECT_URI = "http://localhost:3000";
    const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
    const RESPONSE_TYPE = "token";

    const [token, setToken] = useState("");
    const [searchKey, setSearchKey] = useState("");
    const [artists, setArtists] = useState([]);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [nextUrl, setNextUrl] = useState("");
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const hash = window.location.hash;
        let token = window.localStorage.getItem("token");
        if (!token && hash) {
            token = hash
                .substring(1)
                .split("&")
                .find((elem) => elem.startsWith("access_token"))
                .split("=")[1];

            window.location.hash = "";
            window.localStorage.setItem("token", token);
        }
        setToken(token);
    }, []);

    const logout = () => {
        setToken("");
        window.localStorage.removeItem("token");
        setArtists([]);
    };

    useEffect(() => {
        setArtists([]);
    }, [searchKey]);

    const searchArtists = async () => {
        if (searchKey.length === 0) return;

        setNotFound(false);
        // setPage(1);
        const { data } = await axios
            .get("https://api.spotify.com/v1/search", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    q: searchKey,
                    type: "artist",
                    limit: 5,
                    offset: 0,
                },
            })
            .catch(function (error) {
                return setNotFound(true);
            });

        console.log(data);

        setTotal(data.artists.total);
        setNextUrl(data.artists.next);
        setArtists(data.artists.items);
    };

    const searchSubmitted = (e) => {
        e.preventDefault();
        setPage(1);
        searchArtists();
    };

    const fetchMoreData = async () => {
        // setPage((prevPage) => prevPage + 1);
        // const { data } = await axios.get("https://api.spotify.com/v1/search", {
        //     headers: {
        //         Authorization: `Bearer ${token}`,
        //     },
        //     params: {
        //         q: searchKey,
        //         type: "artist",
        //         limit: 5,
        //         offset: page * 5,
        //     },
        // });

        const { data } = await axios.get(nextUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        setTotal(data.artists.total);
        setNextUrl(data.artists.next);
        console.log(data);
        setArtists((prevArtists) => [...prevArtists, data.artists.items]);
        console.log("Hello World!");
    };

    useEffect(() => {
        total > 0 ? setHasMore(true) : setHasMore(false);
    }, [total]);

    return (
        <div className="App">
            <header className="App-header">
                <h1>Spotify</h1>

                {!token ? (
                    <a
                        href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}
                    >
                        Login to Spotify
                    </a>
                ) : (
                    <button onClick={logout} >Logout</button>
                )}

                {token ? (
                    <form onSubmit={searchSubmitted}>
                        <input
                            type="text"
                            onChange={(e) => setSearchKey(e.target.value)}
                        />
                        <button type={"submit"}>Search</button>
                    </form>
                ) : (
                    <h2>Please login</h2>
                )}

                {artists.length > 0 && (
                    <InfiniteScroll
                        dataLength={artists.length}
                        next={fetchMoreData}
                        hasMore={hasMore}
                        loader={<h5>Loading...</h5>}
                    >
                        {artists.map((artist, index) => (
                            <div key={artist.id}>
                                {artist.images.length ? (
                                    <img
                                        width={"100%"}
                                        src={artist.images[0].url}
                                        alt=""
                                    />
                                ) : (
                                    <div>No Image</div>
                                )}
                                {artist.name}
                            </div>
                        ))}
                    </InfiniteScroll>
                )}

                {notFound && <h5>Couldn't find anything.</h5>}
            </header>
        </div>
    );
}

export default App;
