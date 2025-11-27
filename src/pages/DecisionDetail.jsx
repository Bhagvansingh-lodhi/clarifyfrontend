// src/pages/DecisionDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";

const DecisionDetail = () => {
  const { id } = useParams();
  const [decision, setDecision] = useState(null);
  const [options, setOptions] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  const [newOption, setNewOption] = useState("");
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaWeight, setNewCriteriaWeight] = useState(3);

  const fetchDecision = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/decisions/${id}`);
      setDecision(res.data.decision);
      setOptions(res.data.options || []);
      setCriteria(res.data.criteria || []);
      // do not auto-set results here; analyze is explicit
    } catch (err) {
      setError("Failed to load this decision.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecision();
  }, [id]);

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newOption.trim()) return;
    try {
      setError("");
      await api.post(`/decisions/${id}/options`, {
        name: newOption,
        summary: "",
      });
      setNewOption("");
      fetchDecision();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add option.");
    }
  };

  const handleAddCriteria = async (e) => {
    e.preventDefault();
    if (!newCriteriaName.trim()) return;
    try {
      setError("");
      await api.post(`/decisions/${id}/criteria`, {
        name: newCriteriaName,
        weight: Number(newCriteriaWeight) || 3,
      });
      setNewCriteriaName("");
      setNewCriteriaWeight(3);
      fetchDecision();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add criteria.");
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError("");
      const res = await api.post(`/decisions/${id}/analyze`);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!decision) return;
    if (options.length === 0) {
      setError("Please add at least one option before using AI.");
      return;
    }
    try {
      setAiLoading(true);
      setError("");
      const res = await api.post("/ai/suggest", {
        decisionTitle: decision.title,
        description: decision.description,
        options: options.map((o) => o.name),
      });

      // apply AI suggestion to backend
      await api.post(`/decisions/${id}/apply-ai`, {
        criteria: res.data.generated.criteria,
        evaluations: res.data.generated.evaluations,
      });

      await fetchDecision();
      await handleAnalyze();
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError("AI suggestion failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Loading decision...</h3>
        </div>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Decision not found</h3>
          <p className="text-sm text-gray-500">The decision you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Header */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-1">
              Decision Analysis
            </p>
            <h1 className="text-2xl font-bold text-gray-900">{decision.title}</h1>
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed">
          {decision.description || "No additional description provided for this decision."}
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left side: options + criteria */}
        <div className="space-y-6">
          {/* Options */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Options</h2>
                <p className="text-sm text-gray-600">
                  Different choices you are comparing
                </p>
              </div>
            </div>

            <form onSubmit={handleAddOption} className="flex gap-3 mb-4">
              <input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder:text-gray-400"
                placeholder="Enter an option to consider..."
                required
              />
              <button
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200 whitespace-nowrap"
                type="submit"
              >
                Add Option
              </button>
            </form>

            {options.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm">
                  No options yet. Add at least two options to compare.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((o) => (
                  <div
                    key={o._id}
                    className="border border-gray-200 rounded-xl px-4 py-3 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{o.name}</span>
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Criteria */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Criteria</h2>
                <p className="text-sm text-gray-600">
                  Factors that matter for this decision (importance 1–5)
                </p>
              </div>
            </div>

            <form onSubmit={handleAddCriteria} className="grid grid-cols-1 sm:grid-cols-[1fr,auto,auto] gap-3 mb-4">
              <input
                value={newCriteriaName}
                onChange={(e) => setNewCriteriaName(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder:text-gray-400"
                placeholder="Enter evaluation criteria..."
                required
              />
              <select
                value={newCriteriaWeight}
                onChange={(e) => setNewCriteriaWeight(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:border-blue-500 text-gray-700"
              >
                <option value={1}>Weight 1</option>
                <option value={2}>Weight 2</option>
                <option value={3}>Weight 3</option>
                <option value={4}>Weight 4</option>
                <option value={5}>Weight 5</option>
              </select>
              <button
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200 whitespace-nowrap"
                type="submit"
              >
                Add Criteria
              </button>
            </form>

            {criteria.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 text-sm">
                  No criteria yet. Add your own or use AI to generate them.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {criteria.map((c) => (
                  <div
                    key={c._id}
                    className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-blue-900">{c.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                      w: {c.weight}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right side: AI + analysis */}
        <div className="space-y-6">
          {/* AI assistant */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
                <p className="text-sm text-gray-600">
                  Let AI propose criteria and pros/cons for each option
                </p>
              </div>
            </div>
            
            <button
              disabled={aiLoading || options.length === 0}
              onClick={handleAiSuggest}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              {aiLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate with AI
                </>
              )}
            </button>
            
            {options.length === 0 && (
              <p className="mt-3 text-sm text-gray-500 text-center">
                Add at least one option before using the AI assistant
              </p>
            )}
          </section>

          {/* Analysis */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Analysis</h2>
                <p className="text-sm text-gray-600">
                  Runs the scoring engine and recommends the best option
                </p>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 mb-6"
            >
              {analyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Run Analysis
                </>
              )}
            </button>

            {!results ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 text-sm">
                  No analysis yet. Use AI or add evaluations, then run analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.recommended && (
                  <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-green-800 uppercase tracking-wide">
                        Recommended Option
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1">
                      {results.recommended.name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-green-700">
                      <span>Score: {results.recommended.score}/100</span>
                      <span>Risk: {results.recommended.risk}</span>
                      <span>Confidence: {results.recommended.confidence}%</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">All Results</h3>
                  {results.results.map((r) => (
                    <div
                      key={r.optionId}
                      className="border border-gray-200 rounded-xl p-4 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-900">{r.name}</span>
                        <span className="text-lg font-bold text-blue-600">
                          {r.score}/100
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Risk: {r.risk}</span>
                        <span>Confidence: {r.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DecisionDetail;