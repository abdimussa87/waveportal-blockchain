import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalWaves, setTotalWaves] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const contractAddress = "0x154337bc7927e88dE9081B4112EB30d3751467f7";
  const contractAbi = abi.abi;
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Get Meta Mask");
        return;
      } else {
        console.log("We got the ethereum object ", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized accounts found");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleConnectToWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get Metamask First.");
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err);
    }
  };
  const wave = async () => {
    setIsLoading(true);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractAbi, signer);
        let count = await wavePortalContract.getTotalNumberOfWaves();
        console.log("The total number of waves from the contract is ", count.toNumber());

        //execute the actual wave from the smart //contract
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined ---", waveTxn.hash);

        count = await wavePortalContract.getTotalNumberOfWaves();
        console.log("Total number of waves now is ", count.toNumber());

        setTotalWaves(count.toNumber());
      } else {
        console.log("Ethereum object does not exist.");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchTotalNumberOfWaves = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractAbi, signer);
      const waves = await wavePortalContract.getTotalNumberOfWaves();
      setTotalWaves(waves.toNumber());
    }
  };
  const fetchAllWaves = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractAbi, signer);
      const waves = await wavePortalContract.getAllWaves();
      let cleanedWaves = [];
      waves.forEach((wave) =>
        cleanedWaves.push({
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        })
      );

      console.log(cleanedWaves);
      setAllWaves(cleanedWaves);
    }
  };
  const handleOnNewWaveEvent = (from, timestamp, message) => {
    console.log("New Wave", from, timestamp, message);
    setAllWaves((prevState) => {
      return [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ];
    });
  };

  const listenForOnNewWaveEvent = (wavePortalContract) => {
    wavePortalContract.on("NewWave", handleOnNewWaveEvent);
  };

  useEffect(() => {
    let wavePortalContract;
    checkIfWalletIsConnected();
    fetchTotalNumberOfWaves();
    fetchAllWaves();

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      wavePortalContract = new ethers.Contract(contractAddress, contractAbi, signer);
      listenForOnNewWaveEvent(wavePortalContract);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave");
      }
    };
  }, []);
  return (
    <div className="mainContainer">
      {isLoading && <p>Loading...</p>}
      {totalWaves && <p>{totalWaves}</p>}
      <div className="dataContainer">
        <div className="header">👋 Hey there!</div>

        <div className="bio">I am Abdi and I'm playing with web3.</div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        {!currentAccount && (
          <button className="waveButton" onClick={handleConnectToWallet}>
            Connect Wallet
          </button>
        )}
        <textarea value={message} col="30" row="30" onChange={(e) => setMessage(e.target.value)} />
        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
