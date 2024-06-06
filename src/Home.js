import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import constants from './constants';
import './App.css'; // CSS dosyanızın dahil edildiğinden emin olun
import myGif from './dede.gif'; // GIF dosyasını içe aktarın

function Home() {
    const [currentAccount, setCurrentAccount] = useState("");
    const [contractInstance, setContractInstance] = useState(null);
    const [status, setStatus] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [entryFee, setEntryFee] = useState('0.001');
    const [prizeAmount, setPrizeAmount] = useState('0');
    const [playerCount, setPlayerCount] = useState(0);

    useEffect(() => {
        const loadBlockchainData = async () => {
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                try {
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    setCurrentAccount(address);
                    window.ethereum.on('accountsChanged', (accounts) => {
                        setCurrentAccount(accounts[0]);
                    });
                } catch (err) {
                    console.error(err);
                }
            } else {
                alert('Please install Metamask to use this application');
            }
        };

        const loadContractData = async () => {
            if (currentAccount) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const contractIns = new ethers.Contract(constants.contractAddress, constants.contractAbi, signer);
                setContractInstance(contractIns);

                try {
                    const status = await contractIns.status();
                    setStatus(status);
                    const winner = await contractIns.getWinner();
                    if (winner === currentAccount) {
                        setIsWinner(true);
                    } else {
                        setIsWinner(false);
                    }

                    const players = await contractIns.getPlayers();
                    setPlayerCount(players.length);
                    const prize = players.length * parseFloat(entryFee);
                    setPrizeAmount(prize.toFixed(3));

                } catch (err) {
                    console.error('Error calling contract methods:', err);
                }
            }
        };

        loadBlockchainData();
        loadContractData();
    }, [currentAccount]);

    const enterLottery = async () => {
        if (contractInstance) {
            const amountToSend = ethers.utils.parseEther(entryFee);
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const balance = await provider.getBalance(currentAccount);

                if (balance.lt(amountToSend)) {
                    setErrorMessage('Insufficient funds to enter the lottery.');
                    return;
                }

                const tx = await contractInstance.enter({ value: amountToSend });
                await tx.wait();

                // Prize amount'ı ve player count'u güncelle
                const players = await contractInstance.getPlayers();
                setPlayerCount(players.length);
                const prize = players.length * parseFloat(entryFee);
                setPrizeAmount(prize.toFixed(3));
            } catch (error) {
                setErrorMessage(error.message);
            }
        }
    };

    const claimPrize = async () => {
        if (contractInstance) {
            try {
                const tx = await contractInstance.claimPrize();
                await tx.wait();
            } catch (error) {
                setErrorMessage(error.message);
            }
        }
    };

    return (
        <div className="container">
            <h1>Lottery Page</h1>
            <img src={myGif} alt="Lottery GIF" className="corner-gif" /> {/* GIF buraya eklendi */}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            <p>Entry Fee: {entryFee} ETH</p>
            <p>Prize Amount: {prizeAmount} ETH</p>
            <div className="button-container">
                {status ? (
                    isWinner ? (
                        <button className="enter-button" onClick={claimPrize}> Claim Prize </button>
                    ) : (
                        <p>You are not the winner</p>
                    )
                ) : (
                    <button className="enter-button" onClick={enterLottery}> Enter Lottery </button>
                )}
            </div>
            
        </div>
    );
}

export default Home;
