import StatsCard from "./StatsCard";

export default function StatsGrid({ stats }) {

    return (

        <div className="grid grid-cols-4 gap-5">

            {stats.map(stat => (

                <StatsCard
                    key={stat.id}
                    {...stat}
                />

            ))}

        </div>

    );

}