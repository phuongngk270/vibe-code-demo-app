

import React, { useMemo, useState } from 'react';
export type Issue = {
  page: number;
  type: string;
  message: string;
  original: string;
  suggestion: string;













































    locationHint?: string;
    pageImageUrl?: string;
    screenshotUrl?: string;
};

type Props = {
    issues: Issue[];
    defaultFilter?: string;
};

const IssuesTable: React.FC<Props> = ({
    issues,
    defaultFilter,
}) => {
    const [filterType, setFilterType] = useState<'All' | string>('All');

    const visible = useMemo(() => {
        if (filterType === 'All') return issues;
        return issues.filter(i => i.type === filterType);
    }, [issues, filterType]);

    const types = useMemo(() => {
        const uniqueTypes = Array.from(new Set(issues.map(i => i.type)));
        return ['All', ...uniqueTypes];
    }, [issues]);

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {types.map(type => {
                    const capitalizedType = type === 'All' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1);
                    return (
                        <button
                            key={type}
                            className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                filterType === type
                                    ? 'bg-[#2A7DE1] text-white border-[#2A7DE1]'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                            onClick={() => setFilterType(type)}
                        >
                            {capitalizedType}
                        </button>
                    );
                })}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Page</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Original</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Suggestion</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Location</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {visible.map((issue, index) => {
                            return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{issue.page}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{issue.type}</td>
                                    <td className="px-4 py-4 text-sm text-gray-900 leading-relaxed">{issue.message}</td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                            <div className="text-red-800 leading-relaxed">{issue.original}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                            <div className="text-green-800 leading-relaxed">{issue.suggestion}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm relative group">
                                        <span className="cursor-help text-gray-900">{issue.locationHint || 'No location specified'}</span>
                                        {issue.screenshotUrl ? (
                                            <div className="absolute z-50 hidden group-hover:block left-0 top-full mt-2 max-w-[360px] rounded-lg border bg-white shadow-xl p-2">
                                                <img
                                                    src={issue.screenshotUrl}
                                                    alt="Location Preview"
                                                    className="w-full h-auto rounded"
                                                    loading="lazy"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Click to enlarge</p>
                                            </div>
                                        ) : issue.locationHint ? (
                                            <div className="absolute z-50 hidden group-hover:block left-0 top-full mt-2 max-w-[200px] rounded-lg border bg-white shadow-xl p-3">
                                                <p className="text-sm text-gray-600">No preview available</p>
                                                <p className="text-xs text-gray-400 mt-1">Screenshot not generated for this issue</p>
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IssuesTable;
