

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
                    const capitalizedType = type === 'All' ? 'All' :
                                          type === 'logic_point' ? 'Logic point' :
                                          type.charAt(0).toUpperCase() + type.slice(1);
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
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {issue.type === 'logic_point' ? 'Logic point' : issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                                    </td>
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
                                    <td className="px-4 py-4 text-sm relative group">
                                        <div className="flex items-center space-x-2">
                                            <span className="cursor-help text-gray-900 break-words">
                                                {issue.locationHint || `Instruction (ii), page ${issue.page}`}
                                            </span>
                                            {issue.screenshotUrl ? (
                                                <div className="inline-flex items-center">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="ml-1 text-xs text-green-600">Preview available</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                    <span className="ml-1 text-xs text-gray-500">No preview</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tooltip/Preview */}
                                        {issue.screenshotUrl ? (
                                            <div className="absolute z-50 hidden group-hover:block left-0 top-full mt-2 max-w-[400px] rounded-lg border bg-white shadow-xl p-3">
                                                <div className="mb-2">
                                                    <p className="text-sm font-medium text-gray-900">Page {issue.page} Preview</p>
                                                    <p className="text-xs text-gray-500">Hover to view, click to enlarge</p>
                                                </div>
                                                <img
                                                    src={issue.screenshotUrl}
                                                    alt={`Page ${issue.page} preview`}
                                                    className="w-full h-auto rounded border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                                                    loading="lazy"
                                                    onClick={() => window.open(issue.screenshotUrl, '_blank')}
                                                    onError={(e) => {
                                                        console.error('Failed to load screenshot:', e);
                                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="absolute z-50 hidden group-hover:block left-0 top-full mt-2 max-w-[250px] rounded-lg border bg-white shadow-xl p-3">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                    <p className="text-sm font-medium text-gray-900">No preview available</p>
                                                </div>
                                                <p className="text-xs text-gray-600">
                                                    Screenshot generation failed or is still processing for page {issue.page}.
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    This usually happens when the PDF content cannot be rendered properly.
                                                </p>
                                            </div>
                                        )}
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
