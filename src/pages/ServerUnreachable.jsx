const ServerUnreachable = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-6xl font-bold text-red-600 mb-4">503</h1>
      <p className="text-xl text-gray-600 mb-8">Server is currently unreachable. Please try again later.</p>
    </div>
  );
};

export default ServerUnreachable;
