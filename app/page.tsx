"use client"
// pages/index.tsx (or your main component file)
import React, { useState, useEffect, useCallback } from 'react';
import { 
    Play, Pause, RotateCcw, Target, Brain, Zap, 
    Lightbulb, Upload, PlusCircle, Calculator, LucideIcon 
} from 'lucide-react';
import FileUpload from '../components/FileUpload'; // Adjust path
import GeminiResponseModal from '../components/GeminiResponseModal'; // Adjust path

// Define data types
interface SupervisedPoint {
  x: number;
  y: number;
  predicted?: number; // Optional, calculated for display
}

interface SupervisedModel {
  slope: number;
  intercept: number;
}

interface UnsupervisedPoint {
  x: number;
  y: number;
  cluster: number | null; // null if not assigned yet
  actualCluster?: number; // For demo/evaluation purposes
}

interface ClusterCenter {
  x: number;
  y: number;
  color: string;
}

interface RLAgentState {
  x: number;
  y: number;
}

interface RLObstacle {
    x: number;
    y: number;
}


const MLPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'supervised' | 'unsupervised' | 'reinforcement'>('supervised');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Gemini LLM State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState<boolean>(false);

  // Supervised Learning State
  const [supervisedData, setSupervisedData] = useState<SupervisedPoint[]>([]);
  const [supervisedModel, setSupervisedModel] = useState<SupervisedModel>({ slope: 1, intercept: 0 });
  const [manualX, setManualX] = useState<string>('');
  const [manualY, setManualY] = useState<string>('');
  const [mse, setMse] = useState<number | null>(null);

  // Unsupervised Learning State
  const [unsupervisedData, setUnsupervisedData] = useState<UnsupervisedPoint[]>([]);
  const [clusters, setClusters] = useState<ClusterCenter[]>([]);
  const [numClusters, setNumClusters] = useState<number>(3);
  const [manualUX, setManualUX] = useState<string>('');
  const [manualUY, setManualUY] = useState<string>('');

  // Reinforcement Learning State
  const [rlAgent, setRlAgent] = useState<RLAgentState>({ x: 0, y: 0 });
  const [rlReward, setRlReward] = useState<number>(0);
  const [rlEpisode, setRlEpisode] = useState<number>(0);
  const [rlGridSize, setRlGridSize] = useState<number>(5);
  const [rlGrid, setRlGrid] = useState<number[][]>(
    Array(5).fill(null).map(() => Array(5).fill(0))
  );
  const [rlGoal, setRlGoal] = useState<RLAgentState>({x: 4, y: 4}); // Use RLAgentState for coordinates
  const [rlObstacles, setRlObstacles] = useState<RLObstacle[]>([{x:2, y:2}, {x:1, y:3}]);
  const [rlEpisodeSteps, setRlEpisodeSteps] = useState<number>(0);


  const callGeminiAPI = async (prompt: string, title: string = "Gemini AI Insights") => {
    setIsModalOpen(true);
    setModalTitle(title);
    setIsGeminiLoading(true);
    setModalContent(null); 

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          const textError = await response.text();
          errorData = { error: `API request failed with status ${response.status}. Response: ${textError.substring(0, 200)}...` };
        }
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }
      const data: { text: string } = await response.json();
      setModalContent(data.text);
    } catch (error: any) {
      console.error("Error calling Gemini API from frontend:", error);
      setModalContent(`Error: ${error.message}. Please check the console for more details. Ensure your API key is correctly set up and the server is responsive.`);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const calculateMSE = useCallback((data: SupervisedPoint[], model: SupervisedModel): number | null => {
    if (data.length === 0) return null;
    const sumSquaredError = data.reduce((sum, point) => {
      const prediction = model.slope * point.x + model.intercept;
      return sum + Math.pow(point.y - prediction, 2);
    }, 0);
    return sumSquaredError / data.length;
  }, []);

  const generateSupervisedData = useCallback((count: number = 20) => {
    const data: SupervisedPoint[] = [];
    const trueSlope = Math.random() * 3 + 0.5;
    const trueIntercept = Math.random() * 5;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 10;
      const y = trueSlope * x + trueIntercept + (Math.random() - 0.5) * 5;
      data.push({ x, y });
    }
    setSupervisedData(data);
    const initialModel: SupervisedModel = { slope: 1, intercept: 0 };
    setSupervisedModel(initialModel);
    setMse(calculateMSE(data, initialModel));
  }, [calculateMSE]);
  
  const initializeClusterCenters = useCallback(() => {
    const initialClusters: ClusterCenter[] = [];
    const baseColors = [
        'hsl(210, 70%, 55%)', // Blue
        'hsl(145, 60%, 45%)', // Green
        'hsl(35, 85%, 55%)', // Orange
        'hsl(300, 60%, 55%)', // Purple
        'hsl(0, 70%, 55%)',   // Red
        'hsl(50, 70%, 50%)'   // Yellow-ish
    ];
    for (let i = 0; i < numClusters; i++) {
      initialClusters.push({
        x: Math.random() * 10,
        y: Math.random() * 8,
        color: baseColors[i % baseColors.length] // Use predefined good looking colors
      });
    }
    setClusters(initialClusters);
  }, [numClusters]);

  const generateUnsupervisedData = useCallback((dataPoints: number = 45) => {
    const data: UnsupervisedPoint[] = [];
    const baseCenters: {x: number, y: number}[] = [];
    for(let i=0; i<numClusters; i++){
        baseCenters.push({x: Math.random()*8+1, y: Math.random()*6+1});
    }
    
    const dataPointsPerCluster = Math.floor(dataPoints/numClusters);

    baseCenters.forEach((center, clusterIndex) => {
      for (let i = 0; i < dataPointsPerCluster; i++) {
        data.push({
          x: center.x + (Math.random() - 0.5) * 3,
          y: center.y + (Math.random() - 0.5) * 3,
          cluster: null, 
          actualCluster: clusterIndex 
        });
      }
    });
    setUnsupervisedData(data);
    initializeClusterCenters();
  }, [numClusters, initializeClusterCenters]);


  const initializeRLGrid = useCallback(() => {
    const newGrid = Array(rlGridSize).fill(null).map(() => Array(rlGridSize).fill(0)); // 0: empty, 10: goal, -5: obstacle
    // Ensure goal and obstacles are within bounds, adjust if rlGridSize changes
    const effectiveGoalX = Math.min(rlGoal.x, rlGridSize - 1);
    const effectiveGoalY = Math.min(rlGoal.y, rlGridSize - 1);
    
    // Ensure goal coordinates are not negative
    const finalGoalX = Math.max(0, effectiveGoalX);
    const finalGoalY = Math.max(0, effectiveGoalY);

    if (finalGoalY < rlGridSize && finalGoalX < rlGridSize) {
        newGrid[finalGoalY][finalGoalX] = 10;
    }


    rlObstacles.forEach(obs => {
        if(obs.y >= 0 && obs.y < rlGridSize && obs.x >=0 && obs.x < rlGridSize) {
             // Avoid placing obstacle on goal
            if (!(obs.y === finalGoalY && obs.x === finalGoalX)) {
                newGrid[obs.y][obs.x] = -5;
            }
        }
    });
    setRlGrid(newGrid);
    setRlGoal({x: finalGoalX, y: finalGoalY}); // Update goal if it was out of bounds
  }, [rlGridSize, rlGoal.x, rlGoal.y, rlObstacles]); // Added rlGoal.x, rlGoal.y to dependencies


  const initializeRL = useCallback(() => {
    setRlAgent({ x: 0, y: 0 });
    setRlReward(0);
    setRlEpisode(0);
    setRlEpisodeSteps(0);
    initializeRLGrid();
  }, [initializeRLGrid]);

  useEffect(() => {
    generateSupervisedData();
    generateUnsupervisedData();
    initializeRL();
  }, []); // Run once on mount

  useEffect(() => {
    if (activeTab === 'unsupervised') {
      setIsPlaying(false); // Stop playing when K changes
      generateUnsupervisedData();
    }
  }, [numClusters, activeTab]); // Re-added activeTab to ensure it runs when tab becomes active

  useEffect(() => {
    if (activeTab === 'reinforcement') {
      setIsPlaying(false); // Stop playing when grid config changes
      initializeRLGrid();
    }
  }, [rlGridSize, rlGoal.x, rlGoal.y, rlObstacles, activeTab, initializeRLGrid]);


  const adjustModel = (param: keyof SupervisedModel, value: string) => {
    const newModel = { ...supervisedModel, [param]: parseFloat(value) };
    setSupervisedModel(newModel);
    setMse(calculateMSE(supervisedData, newModel));
  };

  const handleSupervisedFileUpload = (data: Record<string, any>[]) => {
    if (data.length > 0 && ('x' in data[0] && 'y' in data[0])) {
      const processedData: SupervisedPoint[] = data.map(row => ({
        x: parseFloat(String(row.x)),
        y: parseFloat(String(row.y))
      })).filter(row => !isNaN(row.x) && !isNaN(row.y));
      
      if (processedData.length > 0) {
        setSupervisedData(processedData);
        const initialModel = { slope: 1, intercept: 0 };
        setSupervisedModel(initialModel);
        setMse(calculateMSE(processedData, initialModel));
      } else {
        alert("Uploaded CSV must contain numeric 'x' and 'y' columns with valid data.");
      }
    } else {
      alert("Uploaded CSV must contain 'x' and 'y' columns.");
    }
  };

  const addSupervisedDataPoint = () => {
    const x = parseFloat(manualX);
    const y = parseFloat(manualY);
    if (!isNaN(x) && !isNaN(y)) {
      const newData = [...supervisedData, { x, y }];
      setSupervisedData(newData);
      setMse(calculateMSE(newData, supervisedModel));
      setManualX('');
      setManualY('');
    } else {
      alert("Please enter valid numbers for X and Y.");
    }
  };

  const runKMeansIteration = useCallback((): boolean => {
    let changed = false;
    if (clusters.length === 0 || unsupervisedData.length === 0) return false;

    const updatedData = unsupervisedData.map(point => {
      let minDistance = Infinity;
      let assignedClusterIndex = point.cluster;
      clusters.forEach((cluster, index) => {
        const distance = Math.sqrt(
          Math.pow(point.x - cluster.x, 2) + Math.pow(point.y - cluster.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          assignedClusterIndex = index;
        }
      });
      if (point.cluster !== assignedClusterIndex) changed = true;
      return { ...point, cluster: assignedClusterIndex };
    });
    const updatedClusters = clusters.map((cluster, index) => {
      const clusterPoints = updatedData.filter(point => point.cluster === index);
      if (clusterPoints.length === 0) return cluster;
      const avgX = clusterPoints.reduce((sum, point) => sum + point.x, 0) / clusterPoints.length;
      const avgY = clusterPoints.reduce((sum, point) => sum + point.y, 0) / clusterPoints.length;
      if (cluster.x !== avgX || cluster.y !== avgY) changed = true;
      return { ...cluster, x: avgX, y: avgY };
    });
    setUnsupervisedData(updatedData);
    setClusters(updatedClusters);
    return changed;
  }, [unsupervisedData, clusters]);

  const runKMeans = useCallback(() => {
    if (!isPlaying || activeTab !== 'unsupervised') return;
    runKMeansIteration();
  }, [isPlaying, activeTab, runKMeansIteration]);

  const handleUnsupervisedFileUpload = (data: Record<string, any>[]) => {
    if (data.length > 0) {
        let x_col = 'x', y_col = 'y';
        const headers = Object.keys(data[0]);
        if (!(headers.includes('x') && headers.includes('y'))) {
            const numericCols = headers.filter(h => typeof data[0][h] === 'number' || !isNaN(parseFloat(String(data[0][h]))));
            if (numericCols.length >= 2) {
                x_col = numericCols[0];
                y_col = numericCols[1];
            } else {
                alert("CSV needs at least two numeric columns (e.g., 'x', 'y' or feature1, feature2).");
                return;
            }
        }
      const processedData: UnsupervisedPoint[] = data.map(row => ({
        x: parseFloat(String(row[x_col])),
        y: parseFloat(String(row[y_col])),
        cluster: null
      })).filter(row => !isNaN(row.x) && !isNaN(row.y));

      if (processedData.length > 0) {
        setUnsupervisedData(processedData);
        initializeClusterCenters();
      } else {
         alert("Uploaded CSV must contain at least two numeric columns with valid data.");
      }
    } else {
      alert("Uploaded CSV is empty or not parsed correctly.");
    }
  };

  const addUnsupervisedDataPoint = () => {
    const x = parseFloat(manualUX);
    const y = parseFloat(manualUY);
    if (!isNaN(x) && !isNaN(y)) {
      setUnsupervisedData([...unsupervisedData, { x, y, cluster: null }]);
      setManualUX('');
      setManualUY('');
    } else {
      alert("Please enter valid numbers for X and Y.");
    }
  };

  const moveAgent = useCallback(() => {
    if (!isPlaying || activeTab !== 'reinforcement' || !rlGrid.length || !rlGrid[0]?.length) return;
    
    const actions = [ { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 } ];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    let newX = Math.max(0, Math.min(rlGridSize - 1, rlAgent.x + randomAction.dx));
    let newY = Math.max(0, Math.min(rlGridSize - 1, rlAgent.y + randomAction.dy));
    
    const currentCellReward = (rlGrid[newY] && rlGrid[newY][newX] !== undefined) ? rlGrid[newY][newX] : -1; 
    const newTotalReward = rlReward + currentCellReward;
    
    setRlAgent({ x: newX, y: newY });
    setRlReward(newTotalReward);
    
    const isAtGoal = newX === rlGoal.x && newY === rlGoal.y;
    const isTooPenalized = newTotalReward < -20 * (rlGridSize / 5);
    const tooManySteps = rlEpisodeSteps > rlGridSize * rlGridSize * 2.5;

    if (isAtGoal || isTooPenalized || tooManySteps) {
      setRlEpisode(prev => prev + 1);
      setRlAgent({ x: 0, y: 0 }); // Reset to start
      setRlReward(0);
      setRlEpisodeSteps(0);
    } else {
        setRlEpisodeSteps(prev => prev + 1);
    }
  }, [isPlaying, activeTab, rlAgent, rlGridSize, rlGrid, rlReward, rlGoal.x, rlGoal.y, rlEpisodeSteps]); // Added rlGoal.x, rlGoal.y to dependencies

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isPlaying) {
      intervalId = setInterval(() => {
        if (activeTab === 'unsupervised') runKMeans();
        else if (activeTab === 'reinforcement') moveAgent();
      }, 300); // Slightly faster interval
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isPlaying, activeTab, runKMeans, moveAgent]);

  // --- UI Components ---
  interface TabButtonProps {
    id: 'supervised' | 'unsupervised' | 'reinforcement';
    icon: LucideIcon;
    title: string;
    active: boolean;
    onClick: () => void;
  }
  const TabButton: React.FC<TabButtonProps> = ({ id, icon: Icon, title, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
        active 
          ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md'
      }`}
    >
      <Icon size={20} />
      {title}
    </button>
  );

  interface SectionHeaderProps {
    title: string;
    Icon: LucideIcon;
    onExplain: () => void;
  }
  const SectionHeader: React.FC<SectionHeaderProps> = ({ title, Icon, onExplain }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center mb-2 sm:mb-0">
            <Icon size={32} className="mr-3 text-blue-500" />
            {title}
        </h3>
        <button
            onClick={onExplain}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 text-amber-900 font-medium rounded-lg hover:bg-amber-500 transition-colors shadow hover:shadow-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
            <Lightbulb size={18} /> Explain with AI
        </button>
    </div>
  );

  const SharedButtonStyles = "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const PrimaryButtonStyles = `${SharedButtonStyles} bg-indigo-600 text-indigo-50 hover:bg-indigo-700 focus-visible:ring-indigo-500`;
  const SecondaryButtonStyles = `${SharedButtonStyles} bg-blue-600 text-blue-50 hover:bg-blue-700 focus-visible:ring-blue-500`;
  const SuccessButtonStyles = `${SharedButtonStyles} bg-green-600 text-green-50 hover:bg-green-700 focus-visible:ring-green-500`;
  const NeutralButtonStyles = `${SharedButtonStyles} bg-slate-600 text-slate-50 hover:bg-slate-700 focus-visible:ring-slate-500`;
  
  const InputStyles = "w-full p-2.5 border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-shadow focus:shadow-md disabled:bg-slate-50";


  const SupervisedSection: React.FC = () => (
    <div className="space-y-8">
      <SectionHeader 
        title="Supervised Learning: Linear Regression" 
        Icon={Target}
        onExplain={() => callGeminiAPI(
            "Explain linear regression in simple terms. What are slope and intercept? How is it used in machine learning? Provide a real-world example, perhaps related to predicting house prices or student scores.", 
            "About Linear Regression"
        )}
      />
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <p className="text-blue-800">
          <strong>Concept:</strong> Supervised learning uses labeled data (X and Y values) to learn a predictive model. Here, we fit a straight line to data points to understand their relationship.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 text-xl">🎯 Regression Plot</h4>
          <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xl h-80 sm:h-96 relative overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 400 250">
              <defs>
                <pattern id="grid-sup" width="40" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 25" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-sup)" />
              {supervisedData.map((point, i) => {
                const predY = supervisedModel.slope * point.x + supervisedModel.intercept;
                return (
                  <g key={`s-p-${i}`}>
                    <circle cx={point.x * 35 + 20} cy={230 - point.y * 20} r="4.5" fill="#3b82f6" opacity="0.8" title={`Actual: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`} />
                    <circle cx={point.x * 35 + 20} cy={230 - predY * 20} r="3.5" fill="#ef4444" opacity="0.9" title={`Predicted: ${predY.toFixed(1)}`} />
                    <line x1={point.x * 35 + 20} y1={230 - point.y * 20} x2={point.x * 35 + 20} y2={230 - predY * 20} stroke="#fca5a5" strokeWidth="1.5" opacity="0.7"/>
                  </g>
                );
              })}
              <line x1="0" y1={230 - supervisedModel.intercept * 20} x2="400" y2={230 - (supervisedModel.slope * ((400-20)/35) + supervisedModel.intercept) * 20} stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <div className="absolute bottom-2 left-2 text-xs text-slate-500 bg-white/70 backdrop-blur-sm px-2 py-1 rounded">
              <span className="text-blue-600 font-semibold">🔵 Actual</span> | <span className="text-red-600 font-semibold">🔴 Predicted</span> | Line: Model Fit
            </div>
             {mse !== null && (
                <div className="absolute top-2 right-2 text-sm bg-slate-100/80 backdrop-blur-sm p-2 rounded-md shadow text-slate-700 font-medium">
                    <strong>MSE:</strong> {mse.toFixed(3)}
                </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="font-semibold text-slate-800 mb-3 text-xl">🎮 Controls & Data</h4>
          <div className="p-4 bg-slate-50 rounded-lg shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Slope (m): <span className="text-blue-600 font-semibold">{supervisedModel.slope.toFixed(2)}</span></label>
              <input type="range" min="-5" max="5" step="0.05" value={supervisedModel.slope}
                onChange={(e) => adjustModel('slope', e.target.value)} className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Y-Intercept (b): <span className="text-blue-600 font-semibold">{supervisedModel.intercept.toFixed(2)}</span></label>
              <input type="range" min="-10" max="20" step="0.1" value={supervisedModel.intercept}
                onChange={(e) => adjustModel('intercept', e.target.value)} className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
            </div>
          </div>
           <button 
            onClick={() => callGeminiAPI(
                `My linear regression model has a slope of ${supervisedModel.slope.toFixed(2)} and an intercept of ${supervisedModel.intercept.toFixed(2)}. The Mean Squared Error (MSE) is ${mse !== null ? mse.toFixed(3) : 'not calculated'}. Can you help me interpret these values? What does the slope tell me about the relationship between X and Y? What does the intercept represent? Is my MSE good or bad (generally speaking)? Provide concise bullet points.`,
                "Interpret My Model"
            )} 
            className={PrimaryButtonStyles} 
            disabled={isGeminiLoading} 
          >
            <Brain size={18} /> {isGeminiLoading ? 'Interpreting...' : 'Interpret Model with AI'}
          </button>
          
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <h5 className="font-semibold text-slate-800 text-lg">Upload Data (CSV)</h5>
            <FileUpload onFileProcessed={handleSupervisedFileUpload} acceptedTypes=".csv" />
            <p className="text-xs text-slate-500 mt-1">CSV should have 'x' and 'y' columns.</p>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-3">
            <h5 className="font-semibold text-slate-800 text-lg">Add Data Point Manually</h5>
            <div className="flex gap-3">
              <input type="number" placeholder="X value" value={manualX} onChange={e => setManualX(e.target.value)} className={InputStyles}/>
              <input type="number" placeholder="Y value" value={manualY} onChange={e => setManualY(e.target.value)} className={InputStyles}/>
            </div>
            <button onClick={addSupervisedDataPoint} className={SuccessButtonStyles}>
              <PlusCircle size={18} /> Add Point
            </button>
          </div>
           <button onClick={() => generateSupervisedData()} className={NeutralButtonStyles}>
              <RotateCcw size={18} /> Generate New Random Data
            </button>
        </div>
      </div>
    </div>
  );

  const UnsupervisedSection: React.FC = () => (
    <div className="space-y-8">
      <SectionHeader 
        title="Unsupervised Learning: K-Means Clustering" 
        Icon={Brain}
        onExplain={() => callGeminiAPI(
            "Explain K-Means clustering in an easy-to-understand way. What are its main steps? What is it used for? Give a simple example.",
            "About K-Means Clustering"
        )}
      />
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
        <p className="text-green-800">
          <strong>Concept:</strong> Unsupervised learning finds hidden patterns in unlabeled data. K-Means clustering groups similar data points into a predefined number (K) of clusters.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-800 text-xl">🧩 K-Means Clustering Demo</h4>
            <div className="flex gap-2">
              <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all ${isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={() => { setIsPlaying(false); generateUnsupervisedData(); }} className="p-2.5 bg-slate-500 text-white rounded-lg shadow-md hover:bg-slate-600 hover:shadow-lg transition-all">
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
          <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xl h-80 sm:h-96 relative overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 400 250">
             <defs>
                <pattern id="grid-unsupervised" width="40" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 25" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-unsupervised)" />
              {unsupervisedData.map((point, i) => (
                <circle key={`u-p-${i}`} cx={point.x * 35 + 20} cy={230 - point.y * 22} r="4"
                  fill={(point.cluster !== null && clusters[point.cluster]) ? clusters[point.cluster].color : '#9ca3af'} opacity="0.7" />
              ))}
              {clusters.map((cluster, i) => (
                <g key={`u-c-${i}`}>
                  <circle cx={cluster.x * 35 + 20} cy={230 - cluster.y * 22} r="8" fill={cluster.color} stroke="white" strokeWidth="2.5" className="shadow-lg" />
                  <text x={cluster.x * 35 + 20} y={230 - cluster.y * 22 + 3.5} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
                    {i + 1}
                  </text>
                </g>
              ))}
            </svg>
             <div className="absolute bottom-2 left-2 text-xs text-slate-500 bg-white/70 backdrop-blur-sm px-2 py-1 rounded">
              Dots: data points | Big circles: cluster centers
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="font-semibold text-slate-800 mb-3 text-xl">🎮 Controls & Data</h4>
          <div className="p-4 bg-slate-50 rounded-lg shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Number of Clusters (K): <span className="text-green-600 font-semibold">{numClusters}</span></label>
              <input type="range" min="2" max="6" value={numClusters}
                onChange={(e) => { setIsPlaying(false); setNumClusters(parseInt(e.target.value));}} className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"/>
            </div>
          </div>
           <button 
                onClick={() => {
                    const dataSummary = unsupervisedData.length > 5 ? 
                                        `There are ${unsupervisedData.length} data points. The first few are: ${JSON.stringify(unsupervisedData.slice(0,3).map(p => ({x:p.x.toFixed(1),y:p.y.toFixed(1)})))}` : 
                                        `Data points: ${JSON.stringify(unsupervisedData.map(p => ({x:p.x.toFixed(1),y:p.y.toFixed(1)})))}`;
                    callGeminiAPI(
                        `I'm using K-Means clustering with K=${numClusters}. ${dataSummary}. Based on general principles or this data description, can you give any advice on choosing K? What is the "elbow method" or "silhouette score" for choosing K? Explain briefly.`,
                        "Choosing K for K-Means"
                )}}
                className={PrimaryButtonStyles} 
                disabled={isGeminiLoading} 
            >
            <Brain size={18} /> {isGeminiLoading ? 'Thinking...' : 'AI Tips for Choosing K'}
          </button>
           <button onClick={() => { if (!isPlaying) runKMeansIteration();}} className={`${SecondaryButtonStyles} ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isPlaying}>
             <Calculator size={18} /> Run Single K-Means Iteration
           </button>
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <h5 className="font-semibold text-slate-800 text-lg">Upload Data (CSV)</h5>
            <FileUpload onFileProcessed={handleUnsupervisedFileUpload} acceptedTypes=".csv" />
            <p className="text-xs text-slate-500 mt-1">CSV should have numeric columns (e.g., 'x', 'y' or 'feature1', 'feature2'). First two used.</p>
          </div>
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <h5 className="font-semibold text-slate-800 text-lg">Add Data Point Manually</h5>
            <div className="flex gap-3">
              <input type="number" placeholder="X value" value={manualUX} onChange={e => setManualUX(e.target.value)} className={InputStyles}/>
              <input type="number" placeholder="Y value" value={manualUY} onChange={e => setManualUY(e.target.value)} className={InputStyles}/>
            </div>
            <button onClick={addUnsupervisedDataPoint} className={SuccessButtonStyles}>
              <PlusCircle size={18} /> Add Point
            </button>
          </div>
           <button onClick={() => generateUnsupervisedData()} className={NeutralButtonStyles}>
              <RotateCcw size={18} /> Generate New Random Data
            </button>
        </div>
      </div>
    </div>
  );
  
  const ReinforcementSection: React.FC = () => (
    <div className="space-y-8">
       <SectionHeader 
        title="Reinforcement Learning: Grid World" 
        Icon={Zap}
        onExplain={() => callGeminiAPI(
            `Explain Reinforcement Learning (RL) using the Grid World example. What are states, actions, rewards, and episodes in this context? How does an agent typically learn in RL? Mention Q-Learning briefly if possible. The grid is ${rlGridSize}x${rlGridSize}.`,
            "About Reinforcement Learning"
        )}
      />
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
        <p className="text-purple-800">
          <strong>Concept:</strong> An agent learns by interacting with an environment. It aims to maximize cumulative rewards by choosing optimal actions, often through trial and error.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-800 text-xl">🤖 Agent in Grid World</h4>
            <div className="flex gap-2">
              <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all ${isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={() => { setIsPlaying(false); initializeRL(); }} className="p-2.5 bg-slate-500 text-white rounded-lg shadow-md hover:bg-slate-600 hover:shadow-lg transition-all">
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-lg shadow-xl aspect-square max-w-md mx-auto">
            <div className={`grid gap-0.5 sm:gap-1`} style={{gridTemplateColumns: `repeat(${rlGridSize}, minmax(0, 1fr))`}}>
              {rlGrid.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={`
                      aspect-square border flex items-center justify-center text-xl sm:text-2xl font-bold
                      transition-all duration-200 ease-in-out
                      ${cell === 10 ? 'bg-green-300 border-green-400 text-green-700' : 
                        cell === -5 ? 'bg-red-300 border-red-400 text-red-700' : 
                        'bg-slate-100 border-slate-300'}
                      ${rlAgent.x === x && rlAgent.y === y ? 'ring-4 ring-blue-500 ring-inset scale-110 z-10 shadow-2xl bg-blue-200' : ''}
                    `}
                    style={{fontSize: `${Math.max(12, Math.floor(36 / rlGridSize))}px`}} // Dynamic font size
                  >
                    {rlAgent.x === x && rlAgent.y === y && '🤖'}
                    {cell === 10 && (rlAgent.x !== x || rlAgent.y !== y) && '🎯'}
                    {cell === -5 && (rlAgent.x !== x || rlAgent.y !== y) && '💥'}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="font-semibold text-slate-800 mb-3 text-xl">📊 Agent Stats & Controls</h4>
          <div className="bg-slate-50 p-4 rounded-lg shadow-md space-y-2 text-slate-700">
            <div className="text-sm"><strong>Current Reward:</strong> <span className="font-mono text-blue-600 text-base">{rlReward}</span></div>
            <div className="text-sm"><strong>Episode:</strong> <span className="font-mono text-blue-600 text-base">{rlEpisode}</span></div>
            <div className="text-sm"><strong>Steps in Episode:</strong> <span className="font-mono text-blue-600 text-base">{rlEpisodeSteps}</span></div>
            <div className="text-sm"><strong>Agent Position:</strong> (<span className="font-mono text-blue-600 text-base">{rlAgent.x}</span>, <span className="font-mono text-blue-600 text-base">{rlAgent.y}</span>)</div>
          </div>
           <button 
                onClick={() => callGeminiAPI(
                    `My reinforcement learning agent is in a ${rlGridSize}x${rlGridSize} grid. Goal at (${rlGoal.x}, ${rlGoal.y}), obstacles at ${JSON.stringify(rlObstacles)}. Current agent position: (${rlAgent.x}, ${rlAgent.y}), reward: ${rlReward}, episode: ${rlEpisode}. The agent is currently moving randomly. What are some basic strategies or algorithms (like Q-learning) it could use to learn to reach the goal efficiently? How would rewards and penalties guide its learning?`,
                    "RL Agent Learning Strategies"
                )}
                className={PrimaryButtonStyles} 
                disabled={isGeminiLoading} 
            >
            <Brain size={18} /> {isGeminiLoading ? 'Analyzing...' : 'AI on Agent Learning'}
          </button>

          <div className="border-t border-slate-200 pt-6 space-y-4">
             <h5 className="font-semibold text-slate-800 text-lg">Grid Configuration:</h5>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Grid Size: <span className="text-purple-600 font-semibold">{rlGridSize}x{rlGridSize}</span></label>
                <input type="range" min="4" max="10" value={rlGridSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsPlaying(false); 
                        const newSize = parseInt(e.target.value);
                        setRlGridSize(newSize);
                        // Optional: intelligently adjust goal/obstacles if they go out of bounds
                        // For simplicity, initializeRLGrid in useEffect will handle this
                    }}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"/>
             </div>
             <p className="text-xs text-slate-500">
                Goal (🎯) is at ({rlGoal.x}, {rlGoal.y}). Obstacles (💥) at {JSON.stringify(rlObstacles)}. Agent (🤖) starts at (0,0).
             </p>
          </div>

          <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg shadow-md border border-slate-200">
            <strong className="text-slate-700">💡 How it works (Simplified):</strong><br/>
            • 🤖 Agent explores the grid (currently randomly).<br/>
            • 🎯 Reaching the goal gives a positive reward (+10).<br/>
            • 💥 Hitting an obstacle gives a penalty (-5).<br/>
            • Over many episodes, a smart agent (e.g., using Q-Learning) would learn an optimal path.
          </div>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 mb-3 tracking-tight">
            🚀 Interactive ML Playground V2 🧠
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            Explore fundamental Machine Learning concepts with hands-on demos, data uploads, and AI-powered explanations from Gemini.
          </p>
        </header>
        
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 mb-10">
          <TabButton id="supervised" icon={Target} title="Supervised" active={activeTab === 'supervised'}
            onClick={() => { setActiveTab('supervised'); setIsPlaying(false); }} />
          <TabButton id="unsupervised" icon={Brain} title="Unsupervised" active={activeTab === 'unsupervised'}
            onClick={() => { setActiveTab('unsupervised'); setIsPlaying(false); }} />
          <TabButton id="reinforcement" icon={Zap} title="Reinforcement" active={activeTab === 'reinforcement'}
            onClick={() => { setActiveTab('reinforcement'); setIsPlaying(false); }} />
        </div>
        
        <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10">
          {activeTab === 'supervised' && <SupervisedSection />}
          {activeTab === 'unsupervised' && <UnsupervisedSection />}
          {activeTab === 'reinforcement' && <ReinforcementSection />}
        </div>
        
        <footer className="text-center mt-12 mb-6 text-slate-500 text-sm">
          <p>✨ Powered by Next.js, TailwindCSS, TypeScript, and Google Gemini. Happy experimenting! ✨</p>
          <p>Designed for learning and exploration.</p>
        </footer>
      </div>
      <GeminiResponseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        content={modalContent}
        isLoading={isGeminiLoading}
      />
    </div>
  );
};

export default MLPlayground;