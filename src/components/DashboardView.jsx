import React, { useState } from 'react';
import { ArrowLeft, Share2, CheckCircle2, AlertCircle, Calendar, Medal, Check } from 'lucide-react';
import { ThemeToggle } from '../contexts/ThemeContext';
import { useTournament } from '../hooks/useTournament';
import { BackendService } from '../services/BackendService';
import { Spinner } from './Spinner';
import { MatchCard } from './MatchCard';
import { Leaderboard } from './Leaderboard';
import { PlayerModal } from './PlayerModal';

const Toast = ({ message, show }) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slideDown">
      <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium">
        <Check className="w-5 h-5" />
        {message}
      </div>
    </div>
  );
};

const ShareAnimation = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 animate-ripple bg-gradient-radial from-indigo-500/20 via-purple-500/10 to-transparent" />
    </div>
  );
};

export const DashboardView = ({ tournamentId, onBack, isRemoteMode }) => {
  const { tournament, matches, loading, error, isRemote } = useTournament(tournamentId, isRemoteMode);
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showCopied, setShowCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (error || !tournament) return <div className="text-center p-8"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold dark:text-white">Not Found</h2><button onClick={onBack} className="mt-4 text-indigo-600">Go Home</button></div>;

  const handleCopy = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
        // 1. If not already remote, upload to Supabase
        if (!isRemote) {
            await BackendService.shareTournament(tournamentId);
        }

        // 2. Create the shareable link (append query param)
        const url = new URL(window.location.href);
        url.searchParams.set('t', tournamentId);

        // 3. Copy to clipboard
        await navigator.clipboard.writeText(url.toString());

        // 4. Show success feedback
        setShowCopied(true);
        setShowAnimation(true);
        setShowToast(true);

        setTimeout(() => {
          setShowCopied(false);
          setShowAnimation(false);
          setShowToast(false);
        }, 2000);

        // 5. Force a reload to switch to "Remote Mode" immediately for the user
        if (!isRemote) {
            window.location.search = `?t=${tournamentId}`;
        }
    } catch (err) {
        alert("Failed to share: " + err.message);
    } finally {
        setIsSharing(false);
    }
  };

  const completion = Math.round((matches.filter(m => m.isComplete).length / matches.length) * 100) || 0;

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20">
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
          <div className="text-center">
            <h2 className="font-bold text-gray-900 dark:text-white">Tournament</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{tournament.players.length} Players • {tournament.config.scheduleMode}</p>
          </div>
          <div className="flex items-center -mr-2">
             <ThemeToggle />
             <button onClick={handleCopy} disabled={isSharing} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative ml-1 disabled:opacity-50">
              {isSharing ? <Spinner /> : (showCopied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />)}
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
          <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="flex p-4 space-x-2">
        <button onClick={() => setActiveTab('matches')} className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${activeTab === 'matches' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}><Calendar className="w-4 h-4 mr-2" /> Matches</button>
        <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}><Medal className="w-4 h-4 mr-2" /> Leaderboard</button>
      </div>

      <div className="px-4">
        {activeTab === 'matches' ? (
          <div className="space-y-2">
            {matches.length === 0 && <div className="text-center py-10 text-gray-400">No matches generated.</div>}
            {matches.map(m => <MatchCard key={m.id} match={m} config={tournament.config} isRemote={isRemote} />)}
          </div>
        ) : (
          <Leaderboard
            players={tournament.players}
            matches={matches}
            config={tournament.config}
            onSelectPlayer={setSelectedPlayer}
          />
        )}
      </div>

      {/* Details Modal */}
      <PlayerModal
        player={selectedPlayer}
        matches={matches}
        onClose={() => setSelectedPlayer(null)}
      />

      {/* Toast Notification */}
      <Toast message="Copied link to clipboard!" show={showToast} />

      {/* Share Animation */}
      <ShareAnimation show={showAnimation} />
    </div>
  );
};
