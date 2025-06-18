import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";

interface WordCloudProps {
  words: { text: string; value: number }[];
}

const WordCloud: React.FC<WordCloudProps> = ({ words }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fixedBlue = "#1E58EB"; // same blue as in your line chart

  useEffect(() => {
    if (!words || words.length === 0) return;

    const width = 700;
    const height = 400;

    // Find maximum and minimum values to scale the font sizes appropriately
    const maxFontSize = d3.max(words, (d) => d.value) || 50;
    const minFontSize = d3.min(words, (d) => d.value) || 10;

    const fontSizeScale = d3
      .scaleLinear()
      .domain([minFontSize, maxFontSize])
      .range([10, 25]);

    const layout = cloud()
      .size([width, height])
      .words(
        words.map((d) => ({
          text: d.text.replace(/^-/, ""),
          size: fontSizeScale(d.value),
        }))
      )
      .padding(6) // increased padding for better separation
      .rotate(() => 0) // all words horizontal
      .fontSize((d) => d.size || 15)
      .on("end", draw);

    layout.start();

    function draw(data: any) {
      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      svg
        .selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .style("font-size", (d: any) => `${d.size}px`)
        .style("fill", fixedBlue) // words now in blue
        .attr("text-anchor", "middle")
        .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)
        .text((d: any) => d.text);
    }

    return () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [words]);

  return <svg ref={svgRef}></svg>;
};

export default WordCloud;
