import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import waveportal from "./utils/WavePortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [waveCount, setWaveCount] = useState(-1);
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const contractAddress = "0x441a46f993FD3629f08Ec6d092D85F456DCDFAB6";

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;

      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const waveportalContract = new ethers.Contract(
          contractAddress,
          waveportal.abi,
          signer
        );

        const waves = await waveportalContract.getAllWaves();
        let wavesCleaned = waves
          .map((wave) => {
            return {
              address: wave.waver,
              timestamp: new Date(wave.timestamp * 1000),
              message: wave.message,
            };
          })
          .sort((a, b) => b.timestamp - a.timestamp);
        setAllWaves(wavesCleaned);
        const countBigNum = await waveportalContract.getTotalWaves();
        const count = countBigNum.toNumber();
        setWaveCount(count);

        let check = false;
        waveportalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);
          let newWave = {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message,
          };
          if (check) {
            setAllWaves((prevState) => [newWave, ...prevState]);
            setWaveCount((prevState) => prevState + 1);
          }
          check = true;
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWaves();
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async (e) => {
    try {
      e.preventDefault();
      if (message === "") {
        alert("Please add a message");
        return;
      }
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const waveportalContract = new ethers.Contract(
          contractAddress,
          waveportal.abi,
          signer
        );

        const waveTxn = await waveportalContract.wave(message, {
          gasLimit: 300000,
        });
        setLoading(true);

        await waveTxn.wait();
        setLoading(false);
        setMessage("");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">👋 Hey there!</div>

        <div className="bio">
          My name is Dave, I have been mainly working with C# and SQL but I am
          enjoying learning Web3, blockchain, and Ethereum. Connect your
          Ethereum wallet and drop me a wave!
        </div>

        <div className="bio">Total waves: {waveCount}</div>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {currentAccount && (
          <form onSubmit={wave} style={{ width: "580px" }}>
            <label>Message:</label>
            <input
              className="message messageInput"
              type="text"
              placeholder="your message"
              onChange={(e) => setMessage(e.target.value)}
              value={message}
              disabled={loading}
              style={{ cursor: loading ? "wait" : "pointer" }}
            />
            <input
              className="waveButton submitButton"
              type="submit"
              value={loading ? "Mining..." : "Wave at Me"}
              disabled={loading}
              style={{ cursor: loading ? "wait" : "pointer" }}
            />
          </form>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div className="message" key={index}>
              <div>
                Message: <strong>{wave.message}</strong>
              </div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Address: {wave.address}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
