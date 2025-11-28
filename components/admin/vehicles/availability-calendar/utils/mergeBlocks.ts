export function mergeOverlappingBlocks(maintenances: any[]) {
  const blockedMaintenances = maintenances.filter((m: any) => m.type === "BLOCKED");
  const otherMaintenances = maintenances.filter((m: any) => m.type !== "BLOCKED");
  
  if (blockedMaintenances.length === 0) {
    return { merged: [], others: otherMaintenances };
  }

  const sorted = [...blockedMaintenances].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const merged: Array<{
    startDate: Date;
    endDate: Date;
    blocks: any[];
    allIds: string[];
  }> = [];
  
  for (const block of sorted) {
    const blockStart = new Date(block.startDate);
    const blockEnd = new Date(block.endDate);
    
    let foundGroup = false;
    for (const group of merged) {
      const groupStart = group.startDate instanceof Date ? group.startDate : new Date(group.startDate);
      const groupEnd = group.endDate instanceof Date ? group.endDate : new Date(group.endDate);
      
      if (blockStart <= groupEnd && blockEnd >= groupStart) {
        group.startDate = blockStart < groupStart ? blockStart : groupStart;
        group.endDate = blockEnd > groupEnd ? blockEnd : groupEnd;
        group.blocks.push(block);
        group.allIds.push(block.id);
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      merged.push({
        startDate: blockStart,
        endDate: blockEnd,
        blocks: [block],
        allIds: [block.id],
      });
    }
  }

  return { merged, others: otherMaintenances };
}

