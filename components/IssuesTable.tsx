

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
                            className={`px-3 py-1 rounded-full border border-gray-300 text-gray-700 text-sm ${filterType === type ? 'bg-[#2A7DE1 text-white' : ''}`}
                            onClick={() => setFilterType(type)}
                        >
                            {capitalizedType}
                        </button>
                    );
                })}
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Original</th>
                        <th>Suggestion</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    {visible.map((issue, index) => {
                        return (
                            <tr key={index}>
                                <td>{issue.page}</td>
                                <td className="capitalize">{issue.type}</td>
                                <td>{issue.message}</td>
                                <td>{issue.original}</td>
                                <td>{issue.suggestion}</td>
                                <td className="relative group">
                                    {issue.locationHint}
                                    {issue.screenshotUrl ? (
                                        <div className="absolute z-50 hidden group-hover:block max-w-[360px] rounded-lg border bg-white shadow-xl p-2">
                                            <img src={issue.screenshotUrl} alt="Location Preview" className="w-full h-auto" />
                                        </div>
                                    ) : (
                                        <div className="absolute z-50 hidden group-hover:block rounded-lg border bg-white shadow-xl p-2">
                                            Preview not available
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default IssuesTable;
