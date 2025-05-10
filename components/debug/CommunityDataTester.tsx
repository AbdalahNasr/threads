"use client";

import { useState, useEffect } from 'react';
import { fetchCommunities } from '@/lib/actions/community.actions';

export default function CommunityDataTester() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchCommunities();
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading community data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Community Data Tester</h2>
      
      <div className="mb-4">
        <h3 className="font-bold">Response Summary:</h3>
        <div className="text-sm">
          <p>Total Communities: {data?.communities?.length || 0}</p>
          <p>Has More: {data?.isNext ? 'Yes' : 'No'}</p>
          <p>Total Count: {data?.totalCommunitiesCount || 0}</p>
        </div>
      </div>
      
      <h3 className="font-bold mb-2">Communities:</h3>
      <div className="space-y-4">
        {data?.communities?.map((community: any, index: number) => (
          <div key={community._id || index} className="border p-3 rounded">
            <h4 className="font-bold">{community.name || 'Unnamed'}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-bold">ID:</span> {community.id || 'N/A'}</div>
              <div><span className="font-bold">_ID:</span> {community._id || 'N/A'}</div>
              <div><span className="font-bold">Username:</span> {community.username || 'N/A'}</div>
              <div><span className="font-bold">Members:</span> {Array.isArray(community.members) ? community.members.length : 'Invalid'}</div>
              <div><span className="font-bold">Image:</span> {community.image ? '✓' : '✗'}</div>
              <div><span className="font-bold">Bio:</span> {community.bio ? '✓' : '✗'}</div>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-500">Raw Data</summary>
              <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(community, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}