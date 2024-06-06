import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import constants from './constants';

function PickWinner() {
    const [owner, setOwner] = useState('');
    const [contractInstance, setContractInstance] = useState(null);
    const [currentAccount, setCurrentAccount] = useState('');
    const [isOwnerConnected, setIsOwnerConnected] = useState(false);
    const [winner, setWinner] = useState('');
    const [status, setStatus] = useState(false);
    const [previousWinners, setPreviousWinners] = useState([]);

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

                    const contractIns = new ethers.Contract(constants.contractAddress, constants.contractAbi, signer);
                    setContractInstance(contractIns);
                } catch (err) {
                    console.error(err);
                }
            } else {
                alert('Please install Metamask to use this application');
            }
        };

        loadBlockchainData();
    }, []);

    useEffect(() => {
        const fetchContractData = async () => {
            if (contractInstance) {
                try {
                    const status = await contractInstance.status();
                    setStatus(status);
                    const winner = await contractInstance.getWinner();
                    setWinner(winner);
                    const owner = await contractInstance.getManager();
                    setOwner(owner);
                    setIsOwnerConnected(owner === currentAccount);
                    const previousWinners = await contractInstance.getPreviousWinners();
                    setPreviousWinners(previousWinners);
                } catch (err) {
                    console.error(err);
                }
            }
        };

        fetchContractData();
    }, [contractInstance, currentAccount]);

    const pickWinner = async () => {
        try {
            const tx = await contractInstance.pickWinner();
            await tx.wait();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className='container'>
            <h1>Result Page</h1>
            <div className='button-container'>
                {status ? (
                    <p>Lottery Winner is : {winner}</p>
                ) : (
                    isOwnerConnected ? (
                        <button className="enter-button" onClick={pickWinner}> Pick Winner </button>
                    ) : (
                        <p>You are not the owner</p>
                    )
                )}
            </div>
            <div>
                <h2>Previous Winners</h2>
                <ul>
                    {previousWinners.map((winner, index) => (
                        <li key={index}>{winner}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default PickWinner;
