document.addEventListener('DOMContentLoaded', async () => {
    const inputText = document.getElementById('inputText');
    const summarizeButton = document.getElementById('summarizeButton');
    const summaryOutput = document.getElementById('summaryOutput');

    summaryOutput.textContent = 'モデルを読み込み中...';
    summarizeButton.disabled = true;

    // Universal Sentence Encoderモデルの読み込み
    // このモデルは文の埋め込みを生成しますが、直接要約するわけではありません。
    // 類似度に基づいて重要な文を抽出するアプローチを試みます。
    const model = await use.load();
    summaryOutput.textContent = 'モデルの読み込みが完了しました。テキストを入力して「要約する」ボタンを押してください。';
    summarizeButton.disabled = false;

    summarizeButton.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (text.length < 50) { // ある程度の長さがないと要約の意味がない
            summaryOutput.textContent = '要約するには、もう少し長いテキストを入力してください。';
            return;
        }

        summarizeButton.disabled = true;
        summaryOutput.textContent = '要約中...';

        try {
            // テキストを文に分割
            // 日本語の句読点（。？！）と改行で分割
            const sentences = text.match(/[^.!?。？！\n]+[.!?。？！\n]*/g) || [];
            if (sentences.length === 0) {
                summaryOutput.textContent = '有効な文が見つかりませんでした。';
                summarizeButton.disabled = false;
                return;
            }

            // 各文の埋め込みを生成
            const embeddings = await model.embed(sentences);

            // 文の重要度を計算（ここでは、各文が他の文とどれだけ似ているかの平均で簡易的に評価）
            const scores = [];
            for (let i = 0; i < sentences.length; i++) {
                let similaritySum = 0;
                for (let j = 0; j < sentences.length; j++) {
                    if (i === j) continue;
                    const sentenceA = tf.slice(embeddings, [i, 0], [1, -1]);
                    const sentenceB = tf.slice(embeddings, [j, 0], [1, -1]);
                    // コサイン類似度を計算
                    const similarity = tf.matMul(sentenceA, sentenceB, false, true).dataSync()[0];
                    similaritySum += similarity;
                }
                scores.push(similaritySum / (sentences.length - 1));
            }

            // スコアに基づいて文をソートし、上位N個を抽出
            const numSentencesToExtract = Math.max(1, Math.floor(sentences.length * 0.3)); // 全体の30%を抽出
            const sortedSentences = sentences
                .map((sentence, index) => ({ sentence, score: scores[index], originalIndex: index }))
                .sort((a, b) => b.score - a.score) // スコアが高い順
                .slice(0, numSentencesToExtract)
                .sort((a, b) => a.originalIndex - b.originalIndex); // 元の順序に戻す

            if (sortedSentences.length > 0) {
                summaryOutput.textContent = sortedSentences.map(s => s.sentence).join(' ');
            } else {
                summaryOutput.textContent = '要約を生成できませんでした。';
            }

        } catch (error) {
            console.error('要約中にエラーが発生しました:', error);
            summaryOutput.textContent = '要約中にエラーが発生しました。コンソールを確認してください。';
        } finally {
            summarizeButton.disabled = false;
        }
    });
});
